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

#### Methods used throughout to manage simple link operations.
#### Note that the only operation requiring a cypher query is to read and send link structure for front end.

  


def create_link(source,target)
  neo = Neography::Rest.new
  neo.create_relationship("links", source, target)
  neo.create_relationship("links", target, source)
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
  cypher_query << "MATCH (a)-[:links]->(b), p= (b)-[?:links]->(c)"
  cypher_query << "WHERE a.name = \'#{page}\' AND b.type = 'post' AND c.type ?= 'post' "
  cypher_query << "RETURN ID(b), b.name, extract(n in nodes(p) : ID(n) )"
  result = neo.execute_query(cypher_query)
  if result then result else raise "cypher error" end
  end



#### Here's the setup for our RESTful backend using Sinatra.


## Load the front end editor. Need to work out a way to select/navigate through pages.
get '/edit/page/*' do
    protected!
    erb:edit
end

## This is the big one. Read all of the posts+links associated with a given page 
## and send them to the front end.
get '/page/:page/links' do
	table = nodes_links(params[:page])['data']
	
	 {  "posts" => table.map{|n| {"id" => n[0] , "name" => n[1], "width"=>100, "height"=>75 } }.uniq ,
  	  	"links" => table.map{|l| l[2] ? {"source" => l[2][0] , "target" => l[2][1] } : nil }.compact }.to_json
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
get '/page/:page/post/:post1/links/:post2' do
	protected!
	create_link( get_post_in_page(params[:post1], params[:page]), get_post_in_page(params[:post2], params[:page]) ).to_json
end

##Delete a post
get '/page/:page/post/name/:name/delete' do
   Neography::Node.load(get_post_in_page( params[:name], params[:page] ) ).del
end


## Does what it says. Create a new node on a given page.
get '/page/:page/post/new/name/:name' do
	protected!
	page = Neography::Node.load(get_page(params[:page]))
	new_post = Neography::Node.create("name" => params[:name], "type" => "post", "href" =>params[:href] )
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

## Hmmm this probably doesn't need to exist
get '/nodes/new/id/:theId' do
	neo = Neography::Rest.new
	if neo.create_unique_node( "id" => params[:theId], "type" => "debug") then
		"made a node with id = #{params[:theId]}"
 	end
end