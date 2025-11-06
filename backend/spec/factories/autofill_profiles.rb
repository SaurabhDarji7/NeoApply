FactoryBot.define do
  factory :autofill_profile do
    user { nil }
    first_name { "MyString" }
    last_name { "MyString" }
    email { "MyString" }
    phone { "MyString" }
    address { "MyString" }
    city { "MyString" }
    state { "MyString" }
    zip { "MyString" }
    country { "MyString" }
    linkedin { "MyString" }
    github { "MyString" }
    portfolio { "MyString" }
  end
end
