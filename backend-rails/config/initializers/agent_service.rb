# Start the Tyrant
Rails.application.config.after_initialize do
  AgentService.instance.start
end
