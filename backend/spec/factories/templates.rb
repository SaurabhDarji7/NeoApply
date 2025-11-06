FactoryBot.define do
  factory :template do
    user { nil }
    name { "MyString" }
    content_text { "MyText" }
    status { "MyString" }
    parsed_attributes { "" }
    raw_llm_response { "" }
    error_message { "MyText" }
    attempt_count { 1 }
    started_at { "2025-11-04 22:42:47" }
    completed_at { "2025-11-04 22:42:47" }
  end
end
