# frozen_string_literal: true

class TailoredAnswerService
  MAX_GENERATIONS_PER_DAY = 20

  def initialize(job_text:, resume:, fields_metadata: [], user:)
    @job_text = job_text
    @resume = resume
    @fields_metadata = fields_metadata
    @user = user
  end

  def generate
    check_rate_limit!

    @fields_metadata.map do |field|
      {
        field_label: field['label'] || field[:label],
        text: generate_answer_for_field(field)
      }
    end
  ensure
    increment_usage_count
  end

  private

  def check_rate_limit!
    count = usage_count_today
    if count >= MAX_GENERATIONS_PER_DAY
      raise StandardError, "Daily limit of #{MAX_GENERATIONS_PER_DAY} AI generations reached. Please try again tomorrow."
    end
  end

  def usage_count_today
    cache_key = "tailored_answers_#{@user.id}_#{Date.today}"
    Rails.cache.read(cache_key) || 0
  end

  def increment_usage_count
    cache_key = "tailored_answers_#{@user.id}_#{Date.today}"
    count = usage_count_today
    Rails.cache.write(cache_key, count + 1, expires_in: 24.hours)
  end

  def extract_resume_text
    # Use parsed content if available
    if @resume.parsed_content.present?
      content = @resume.parsed_content

      parts = []

      # Summary
      parts << content['summary'] if content['summary'].present?

      # Experience
      if content['experience'].present?
        exp_text = content['experience'].map do |e|
          "#{e['title']} at #{e['company']}: #{e['description']}"
        end.join("\n")
        parts << exp_text
      end

      # Education
      if content['education'].present?
        edu_text = content['education'].map do |e|
          "#{e['degree']} from #{e['institution']}"
        end.join("\n")
        parts << edu_text
      end

      # Skills
      if content['skills'].present?
        parts << "Skills: #{content['skills'].join(', ')}"
      end

      return parts.join("\n\n")
    end

    # Fallback
    "Resume content available but not parsed. Please ensure resume is parsed first."
  end

  def generate_answer_for_field(field)
    label = (field['label'] || field[:label]).to_s.downcase
    max_length = field['maxLength'] || field[:maxLength]

    resume_text = extract_resume_text

    # Determine field type from label
    if cover_letter_field?(label)
      generate_cover_letter(resume_text, max_length)
    elsif why_interested_field?(label)
      generate_why_interested(resume_text, max_length)
    elsif experience_field?(label)
      generate_experience_summary(resume_text, max_length)
    else
      # Generic response
      generate_generic_answer(label, resume_text, max_length)
    end
  end

  def cover_letter_field?(label)
    label.include?('cover') || label.include?('letter')
  end

  def why_interested_field?(label)
    label.include?('why') || label.include?('interested') || label.include?('motivation')
  end

  def experience_field?(label)
    label.include?('experience') || label.include?('background') || label.include?('qualification')
  end

  def generate_cover_letter(resume_text, max_length)
    prompt = <<~PROMPT
      Write a concise, professional cover letter paragraph based on this resume:

      #{resume_text}

      For this job:
      #{truncate_job_text}

      Requirements:
      - Be professional and enthusiastic
      - Highlight 2-3 most relevant skills or experiences
      - Show genuine interest in the role
      - Keep it under #{max_length || 500} characters
      - No greeting or signature, just the body paragraph
      - Write in first person
    PROMPT

    call_openai(prompt, max_length || 500)
  end

  def generate_why_interested(resume_text, max_length)
    prompt = <<~PROMPT
      Explain why the candidate is interested in this role based on their background:

      Resume:
      #{resume_text}

      Job Description:
      #{truncate_job_text}

      Requirements:
      - Be specific and genuine
      - Reference 1-2 relevant experiences or skills
      - Show alignment between candidate's goals and company/role
      - Keep it under #{max_length || 300} characters
      - Write in first person
    PROMPT

    call_openai(prompt, max_length || 300)
  end

  def generate_experience_summary(resume_text, max_length)
    prompt = <<~PROMPT
      Summarize the candidate's most relevant experience for this job:

      Resume:
      #{resume_text}

      Job Description:
      #{truncate_job_text}

      Requirements:
      - Focus on the 2-3 most relevant experiences
      - Be concise and impactful
      - Quantify achievements where possible
      - Keep it under #{max_length || 400} characters
      - Write in first person
    PROMPT

    call_openai(prompt, max_length || 400)
  end

  def generate_generic_answer(label, resume_text, max_length)
    prompt = <<~PROMPT
      Answer this question from a job application: "#{label}"

      Based on this resume:
      #{resume_text}

      For this job:
      #{truncate_job_text}

      Requirements:
      - Be relevant, professional, and thoughtful
      - Reference specific skills or experiences from the resume
      - Keep it under #{max_length || 300} characters
      - Write in first person
    PROMPT

    call_openai(prompt, max_length || 300)
  end

  def truncate_job_text
    # Limit job text to first 2000 characters to save tokens
    @job_text.to_s[0...2000]
  end

  def call_openai(prompt, max_length)
    return fallback_response unless openai_configured?

    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])

    # Estimate tokens (rough: 1 token ≈ 4 characters)
    max_tokens = [(max_length || 500) / 3, 150].max.to_i

    response = client.chat(
      parameters: {
        model: 'gpt-3.5-turbo', # Using 3.5-turbo for cost efficiency
        messages: [{ role: 'user', content: prompt }],
        max_tokens: max_tokens,
        temperature: 0.7
      }
    )

    text = response.dig('choices', 0, 'message', 'content')&.strip || fallback_response

    # Truncate if needed
    if max_length && text.length > max_length
      text = text[0...max_length].strip
      # Try to end at a sentence
      last_period = text.rindex('.')
      text = text[0..last_period] if last_period && last_period > max_length / 2
    end

    text
  rescue StandardError => e
    Rails.logger.error("OpenAI API error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    fallback_response
  end

  def openai_configured?
    ENV['OPENAI_API_KEY'].present?
  end

  def fallback_response
    "I am excited about this opportunity and believe my skills and experience make me a strong fit for this role. I look forward to discussing how I can contribute to your team."
  end
end
