class SummonController < ApplicationController
  def trigger
    AgentService.instance.manual_summon
    render json: { status: "summoning" }
  end

  def status
    render json: { 
      isSummoning: AgentService.instance.is_summoning,
      shameMessage: AgentService.instance.current_shame_message,
      summonMessage: AgentService.instance.current_summon_message,
      anger: AgentService.instance.current_anger
    }
  end

  def stop
    AgentService.instance.stop_summon
    render json: { status: "stopped" }
  end
end
