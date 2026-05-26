#!/usr/bin/env ruby
# Validate Google Scholar/Highwire metadata emitted by the Hugo build.

require "cgi"
require "date"
require "json"
require "yaml"

ROOT = File.expand_path("../..", __dir__)
PUBLIC_DIR = File.join(ROOT, "public")
DATA_PATH = File.join(ROOT, "data", "zenodo.json")
BASE_URL = ENV.fetch("SITE_URL", "https://genomicsxai.github.io").sub(%r{/+\z}, "")
REQUIRE_ACCEPTED_DOI = ARGV.include?("--require-accepted-doi")

def frontmatter(path)
  raw = File.read(path)
  match = raw.match(/\A---\s*\n(.*?)\n---\s*\n/m)
  abort("Missing frontmatter in #{path}") unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
end

def meta_values(html, name)
  html.scan(/<meta\b[^>]*>/i).filter_map do |tag|
    next unless tag.match?(/\bname\s*=\s*["']?#{Regexp.escape(name)}["']?(?:\s|>|\/)/i)

    content = tag[/\bcontent\s*=\s*"([^"]*)"/i, 1] ||
              tag[/\bcontent\s*=\s*'([^']*)'/i, 1] ||
              tag[/\bcontent\s*=\s*([^\s>]+)/i, 1]
    CGI.unescapeHTML(content.to_s)
  end
end

def expected_authors(fm)
  authors = fm["authors_display"] || fm["authors"] || []
  authors.map { |author| author.is_a?(Hash) ? author["name"] : author }.compact
end

def expected_publication_date(fm)
  raw = fm["date_accepted"] || fm["date"]
  Date.parse(raw.to_s).strftime("%Y/%m/%d")
end

zenodo = File.exist?(DATA_PATH) ? JSON.parse(File.read(DATA_PATH)) : {}
errors = []

Dir.glob(File.join(ROOT, "content", "blogs", "*", "index.md")).sort.each do |path|
  fm = frontmatter(path)
  next if fm["draft"] == true
  next unless fm["status"].to_s == "accepted"

  post_id = fm.fetch("post_id")
  rel_html = File.join("blogs", post_id, "index.html")
  html_path = File.join(PUBLIC_DIR, rel_html)

  unless File.exist?(html_path)
    errors << "#{path}: expected built page at public/#{rel_html}"
    next
  end

  html = File.read(html_path)
  expected_url = "#{BASE_URL}/blogs/#{post_id}/"
  expected_doi = zenodo.dig(post_id, "current_doi").to_s

  title_values = meta_values(html, "citation_title")
  errors << "#{path}: missing citation_title" if title_values.empty?
  errors << "#{path}: citation_title does not match frontmatter title" unless title_values.include?(fm["title"].to_s)

  author_values = meta_values(html, "citation_author")
  expected_authors(fm).each do |author|
    errors << "#{path}: missing citation_author for #{author}" unless author_values.include?(author)
  end

  publication_date = expected_publication_date(fm)
  unless meta_values(html, "citation_publication_date").include?(publication_date)
    errors << "#{path}: citation_publication_date must be #{publication_date}"
  end

  unless meta_values(html, "citation_fulltext_html_url").include?(expected_url)
    errors << "#{path}: citation_fulltext_html_url must be #{expected_url}"
  end

  if expected_doi.empty?
    errors << "#{path}: accepted post is missing Zenodo DOI metadata" if REQUIRE_ACCEPTED_DOI
  elsif !meta_values(html, "citation_doi").include?(expected_doi)
    errors << "#{path}: citation_doi must be #{expected_doi}"
  end

  if fm["pdf_url"] || fm["pdf"]
    errors << "#{path}: missing citation_pdf_url" if meta_values(html, "citation_pdf_url").empty?
  end

  robots = meta_values(html, "robots").join(",")
  errors << "#{path}: production article page must not be noindex" if robots.match?(/noindex/i)
end

if errors.any?
  warn "Google Scholar metadata validation failed:"
  errors.each { |error| warn "  - #{error}" }
  exit 1
end

puts "Google Scholar metadata validation passed."
