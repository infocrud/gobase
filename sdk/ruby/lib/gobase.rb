require_relative "gobase/client"
require_relative "gobase/auth"
require_relative "gobase/query_builder"
require_relative "gobase/storage"
require_relative "gobase/functions"

module Gobase
  # Create a new GoBase client.
  #
  # @param base_url [String] e.g. "http://localhost:8000"
  # @return [Client]
  def self.create_client(base_url)
    Client.new(base_url)
  end
end
