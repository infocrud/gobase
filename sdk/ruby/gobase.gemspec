Gem::Specification.new do |s|
  s.name        = "gobase"
  s.version     = "0.1.0"
  s.summary     = "Ruby client for GoBase — open-source BaaS"
  s.description = "Auth, REST CRUD, storage, and edge functions for the GoBase platform."
  s.authors     = ["GoBase Contributors"]
  s.homepage    = "https://github.com/infocrud/gobase"
  s.license     = "MIT"

  s.files       = Dir["lib/**/*.rb"]
  s.require_paths = ["lib"]

  s.required_ruby_version = ">= 2.7"
  s.add_dependency "faraday", "~> 2.0"
  s.add_dependency "faraday-multipart", "~> 1.0"
end
