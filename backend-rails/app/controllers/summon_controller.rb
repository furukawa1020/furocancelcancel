class SummonController < ApplicationController
  def trigger
    AgentService.instance.manual_summon
    render json: { status: "summoning" }
  end

  def status
    user = User.first # In production, this would be authenticated
    render json: { 
      isSummoning: AgentService.instance.is_summoning,
      shameMessage: AgentService.instance.current_shame_message,
      summonMessage: AgentService.instance.current_summon_message,
      anger: AgentService.instance.current_anger,
      startHour: user&.start_hour || 18,
      curfewHour: user&.curfew_hour || 23
    }
  end

  def stop
    AgentService.instance.stop_summon
    render json: { status: "stopped" }
  end
end
