require 'rubygems'
require 'neography'
require 'sinatra'
require 'uri'

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

def create_indexed_node(type, name)
  	neo = Neography::Rest.new
  	node = neo.create_node("type" => type, "name" => name)
  	neo.add_node_to_index("nodes_index","type", type, node)
  	return node
  end
end

def create_gluestick_graph
  @neo = Neography::Rest.new
    
  root = create_indexed_node("root", "root")
  
  count = (1..6).to_a
  count.each_index do |x|
	page = create_indexed_node("page", x.to_s)
	@neo.create_relationship("links", root, page)
  end
 
end



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


def nodes_links
  neo = Neography::Rest.new
  cypher_query =  " START a = node:nodes_index(type='Post')"
  cypher_query << " MATCH a-[:links]->b"
  cypher_query << " RETURN a.id, b.id"
  neo.execute_query(cypher_query)["data"]
end

get '/edit' do
    protected!
    erb:edit
end

get '/list.json' do
   {  "nodes" => nodes_links.map{|fm| {"id" => fm[0], "attr"=> { "attr0" => fm[0]*4655, "attr1" => fm[0]*4 },  "group"=>1 }}.uniq ,
  	  "links" => nodes_links.map{|fm| {"source" => fm[0], "target" => fm[1] }} }.to_json
end




get '/nodes/new/links/:link' do
    {"result" => "this would have created a new node attached to #{params[:link]} if it were working!"}.to_json
end

###Development Methods --- Not to be available in production
get '/defined_nodes' do
  	neo = Neography::Rest.new
    { "nodes_index" => neo.list_node_indexes}.to_json
end

get '/nodes/new/id/:theId' do
	neo = Neography::Rest.new
	if neo.create_unique_node( "id" => params[:theId], "type" => "debug") then
		"made a node with id = #{params[:theId]}"
 	end
end


get '/page/:page/node/new/:name' do
	  @neo = Neography::Rest.new
	  page = @neo.execute_query("START r=node:nodes_index(type='root') MATCH r --> p WHERE (p.type = 'page' AND p.name = \'#{params[:page]}\' )  RETURN p")
		page.to_json
		
	  #new_post = create_indexed_node("post", "#{params[:name] }")

	  #@neo.create_relationship("links",new_post, page)

end

