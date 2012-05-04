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

def nodes_matrix
  neo = Neography::Rest.new
  cypher_query =  " START a = node:nodes_index(type='Post')"
  cypher_query << " MATCH a-[:links]->b"
  cypher_query << " RETURN a.id, collect(b.id)"
  neo.execute_query(cypher_query)["data"]
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


get '/nodes' do
	#WORKS BUT REQUIRES LOTS OF MESSY JS
	{"nodes" => nodes_matrix.map{|fm| {"id" => fm[0], "links" => fm[1][1..(fm[1].size - 2)]}}}.to_json
end

get '/matrix' do
	########Better Maybe?
	{"matrix" => nodes_links.map{|m| { "id" => m[0], "dist" => m[1]-m[0]   }}}.to_json

end

get '/list.json' do
   {  "nodes" => nodes_links.map{|fm| {"id" => fm[0], "attr"=> { "attr0" => fm[0]*4655, "attr1" => fm[0]*4 },  "group"=>1 }}.uniq ,
  	  "links" => nodes_links.map{|fm| {"source" => fm[0], "target" => fm[1] }} }.to_json
end
