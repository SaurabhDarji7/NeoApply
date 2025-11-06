# frozen_string_literal: true

class CreateSolidQueueTables < ActiveRecord::Migration[8.0]
  def change
    create_table :solid_queue_jobs do |t|
      t.string :queue_name, null: false
      t.string :class_name, null: false
      t.text :arguments
      t.integer :priority, default: 0, null: false
      t.string :concurrency_key
      t.string :active_job_id
      t.datetime :scheduled_at
      t.datetime :finished_at
      t.string :finished_state
      t.text :error
      t.integer :attempts, default: 0

      t.timestamps

      t.index [:queue_name, :finished_at]
      t.index :scheduled_at
      t.index [:active_job_id, :finished_at]
    end

    create_table :solid_queue_scheduled_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }, index: false
      t.datetime :scheduled_at, null: false
      t.integer :priority, default: 0, null: false
      t.datetime :created_at, null: false

      t.index [:scheduled_at, :priority]
    end

    create_table :solid_queue_ready_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }, index: false
      t.string :queue_name, null: false
      t.integer :priority, default: 0, null: false
      t.datetime :created_at, null: false

      t.index [:priority, :created_at]
    end

    create_table :solid_queue_claimed_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }, index: false
      t.bigint :process_id
      t.datetime :created_at, null: false

      t.index :process_id
    end

    create_table :solid_queue_blocked_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }, index: false
      t.string :queue_name, null: false
      t.integer :priority, default: 0, null: false
      t.string :concurrency_key, null: false
      t.datetime :expires_at, null: false
      t.datetime :created_at, null: false

      t.index [:expires_at, :concurrency_key]
    end

    create_table :solid_queue_failed_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }, index: false
      t.text :error
      t.datetime :created_at, null: false

      t.index :created_at
    end

    create_table :solid_queue_pauses do |t|
      t.string :queue_name, null: false
      t.datetime :created_at, null: false

      t.index :queue_name, unique: true
    end

    create_table :solid_queue_processes do |t|
      t.string :kind, null: false
      t.datetime :last_heartbeat_at, null: false
      t.bigint :supervisor_id
      t.integer :pid, null: false
      t.string :hostname
      t.text :metadata

      t.timestamps

      t.index :last_heartbeat_at
      t.index :supervisor_id
    end

    create_table :solid_queue_recurring_executions do |t|
      t.references :job, null: false, foreign_key: { to_table: :solid_queue_jobs }
      t.string :task_key, null: false
      t.datetime :run_at, null: false
      t.datetime :created_at, null: false

      t.index [:task_key, :run_at]
    end
  end
end
