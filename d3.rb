require 'rubygems'
require 'neography'
require 'sinatra'
require 'uri'

@neo2 = Neography::Rest.new

###### Keep Editing modes off limits to prying eyes!!!
helpers do

  def protected!
    unless authorized?
      response['WWW-Authenticate'] = %(Basic realm="Restricted Area")
      throw(:halt, [401, "Not authorized\n"])
    end
  end

  def authorized?
    @auth ||=  Rack::Auth::Basic::Request.new(request.env)
    @auth.provided? && @auth.basic? && @auth.credentials && @auth.credentials == ['editor', 'admin']
  end
end

def create_indexed_node(type, name)
  	neo = Neography::Rest.new
  	node = neo.create_node("type" => type, "name" => name)
  	neo.add_node_to_index("nodes_index","type", type, node)
  	return node
end

## Run these from terminal with rake neo4j:create[_gluestick] command within gluestick dir
## First one is probably deprecated... but could be useful for testing
def create_graph
  neo = Neography::Rest.new
  graph_exists = neo.get_node_properties(1)
  return if graph_exists && graph_exists['name']

  ids = (1..30).to_a

  commands = ids.map{ |n| [:create_node, {"id" => n}]}
  ids.each_index do |x|
    commands << [:add_node_to_index, "nodes_index", "type", "Post", "{#{x}}"]
    links = ids.size.times.map{|y| y}
    links.delete_at(x)
    links.sample(1 + rand(5)).each do |f|
      commands << [:create_relationship, "links", "{#{x}}", "{#{f}}"]
    end
  end

  batch_result = neo.batch *commands
end

#### Create the paged graph structure to initialize the whole deal.

def create_gluestick_graph
  @neo = Neography::Rest.new
    
  root = create_indexed_node("root", "root")
  
  num_pages = (1..7)
  num_posts = (1..20)
  num_links = (1..45)
  num_pages.to_a.each do |x|
	page = create_indexed_node("page", x.to_s)
	@neo.create_relationship("links", root, page)
	num_posts.to_a.each do |y|
		post = create_indexed_node("post", y.to_s)
		@neo.create_relationship("links", page, post)
    end
    num_links.to_a.each do |y|
    ##following works fine locally but comes back with 'cannot convert range to int' on heroku
	  	create_link( get_post_in_page(rand(num_posts).to_s, x.to_s), get_post_in_page(rand(num_posts).to_s, x.to_s) ) 
	end
  end
end

def create_pages
  @neo = Neography::Rest.new
    
  root = create_indexed_node("root", "root")
  
  num_pages = (1..7)
  num_posts = (1..20)
  num_links = (1..45)
  num_pages.to_a.each do |x|
	page = create_indexed_node("page", x.to_s)
	@neo.create_relationship("links", root, page)
	num_posts.to_a.each do |y|
		post = create_indexed_node("post", y.to_s)
		@neo.create_relationship("links", page, post)
    end
    
  end
end

def add_page(page_num)
  @neo = Neography::Rest.new
  num_posts = (1..20)
  
  root = @neo.get_node_index("nodes_index", "type", "root")
  page = create_indexed_node("page", page_num.to_s)
  @neo.create_relationship("links", root, page)
		 num_posts.to_a.each do |y|
			post = create_indexed_node("post", y.to_s)
			@neo.create_relationship("links", page, post)  		 
			end
  end





###Find duplicates in an array and place count next to uniq values
def dup_hash(ary)
  ary.inject(Hash.new(0)) { |h,e| h[e] += 1; h }.select { 
    |k,v| v > 1 }.inject({}) { |r, e| r[e.first] = e.last; r }
end
def new_dup_hash(ary)
	h = Hash.new(0)
	ary.each { |v| h.store(v, h[v]+1) }
	h
end

#### Methods used throughout to manage simple link operations.
def get_node(id)
	neo = Neography::Rest.new
	neo.get_node(id)
	end


def create_link(source,target)
  neo = Neography::Rest.new
  rel = []
  rel[0] = neo.create_relationship("links", source, target)
  rel[1] = neo.create_relationship("links", target, source)
  #rel.each do |x| 
  #	weight = neo.get_relationship_properties(x, "weight")
  #	weight ? weight+=1 : weight=1
  #	neo.set_relationship_properties(x, {"weight" => weight})
  #	end
  end

def get_post_by_name(name)
  neo = Neography::Rest.new
  post = neo.get_node_index("nodes_index", "type", "post").select{|n| n['data']['name'] == name }.map{|n| n['self']}
  end

def get_page(page)
  neo = Neography::Rest.new
  pages = neo.get_node_index("nodes_index", "type", "page")
  page = pages.select{|n| n['data']['name'] == page }.map{|n| n['self']}
  return page
  end

def get_post_in_page(name, page)
  neo = Neography::Rest.new
  cypher_query =  "START a = node:nodes_index(type='page')"
  cypher_query << "MATCH (a)-[:links]->(b)"
  cypher_query << "WHERE a.name = \'#{page}\' AND b.type = 'post' AND b.name = \'#{name}\' "
  cypher_query << "RETURN ID(b)"
  result = neo.execute_query(cypher_query)
  result ? result['data'][0] : nil
  end

#### Get ALL OF THE POSTS AND LINKS associated with a given page.
def nodes_links(page)
  neo = Neography::Rest.new
  cypher_query =  "START a = node:nodes_index(type='page')"
  cypher_query << "MATCH (a)-[:links]->(b), p=(b)-[?]->(c)"
  cypher_query << "WHERE a.name = \'#{page}\' AND b.type = 'post' AND c.type ?= 'post' "
  cypher_query << "RETURN ID(b), b.name?, b.href?, b.fixed?, extract(n in nodes(p) : ID(n) )"
  result = neo.execute_query(cypher_query)
  if result then result else nil end
  end

#### Here's the setup for our RESTful backend using Sinatra.


## Load the front end editor. Need to work out a way to select/navigate through pages.
get '/edit/page/*' do
    protected!
    erb:edit
end

## Read all of the posts+links associated with a given page 
## and send them to the front end.
get '/page/:page/links' do
	table = nodes_links(params[:page])['data']
	if(!table[0]) then add_page(params[:page])
					table=nodes_links(params[:page])['data']
			   end
	list = {   "posts" => table.map{|n| {"id" => n[0] , "name" => n[1], "href" => n[2], "fixed"=>n[3] } }.uniq ,
		  	  	"links" => table.map{|l| l[4] ? {"source" => l[4][0] , "target" => l[4][1] } : nil }.compact }

	###Get rid of duplicate links, but add a count of connections to each unique record.
	de_duped_links = new_dup_hash(list['links']).map{|l,c| { "source" => l['source'], "target" => l['target'], "value" => c}}

	{ "posts" => list['posts'], "links" => de_duped_links }.to_json
end

get'/page/:page/cypher_debug' do
	nodes_links(params[:page])['data'].to_json
end


## Get the page node. 
## Not really sure when this would be useful so it may belong in the dev section.
get '/page/:page' do
	page = Neography::Node.load(get_page(params[:page]))
	page.to_json
end

## Get an post by neo_id from the stated page.
get '/page/:page/post/:name' do
	get_post_in_page( params[:name], params[:page] ).to_json
	end


## Link two posts
get '/post/:post1/links/:post2' do
	protected!
	create_link( get_node(params[:post1]), get_node(params[:post2]) ).to_json
end

##Delete a post
get '/post/id/:id/delete' do
   Neography::Node.load(params[:id] ).del
end

##Set a post's fixed status
get '/post/id/:id/fixed/?:fixed?/?:x?/?:y?' do
   neo = Neography::Rest.new
   if (params[:id]) then
     neo.set_node_properties( get_node(params[:id]), { "fixed" => params[:fixed], "x" => params[:x], "y" => params[:y] })
   else
	 neo.set_node_properties( get_node(params[:id]), { "fixed" => params[:fixed] })
   end
  neo.get_node_properties( get_node(params[:id])).to_json
end

## Does what it says. Create a new node on a given page.
get '/page/:page/post/new/name/:name/href/:href' do
	protected!
	page = Neography::Node.load(get_page(params[:page]))
	new_post = Neography::Node.create("name" => params[:name], "type" => "post", "href" =>params[:href], "fixed" =>false )
	page.both(:links) << new_post
	{data:[ {"neo_id" => new_post.neo_id, "name" => new_post.name, "links" => new_post.outgoing(:links).map{|n| n.neo_id} }]}.to_json
	end







## Just for testing. Confirm existence of an index.
get '/nodes_index' do
  	neo = Neography::Rest.new
    { "nodes_index" => neo.list_node_indexes}.to_json
end

## Just for testing. Get raw cypher query.
get '/page/:page/list_all' do
	nodes_links(params[:page]).to_json
end
