# coding: utf-8
require File.expand_path('../lib/timemapjs/rails/version', __FILE__)

Gem::Specification.new do |spec|
  spec.name          = "timemapjs-rails"
  spec.version       = Timemapjs::Rails::VERSION
  spec.authors       = ["Artem Levenkov"]

  spec.summary       = "time map"
  spec.homepage      = "https://github.com/bitia-ru/timemap.git"
  spec.license       = 'MIT'
  
  spec.add_dependency "jquery-rails", '>= 2.0'

  spec.files        = `git ls-files`.split("\n")
  spec.executables  = `git ls-files -- bin/*`.split("\n").map { |f| File.basename(f) }
  spec.require_paths = 'lib'

end
