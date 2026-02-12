class NfcController < ApplicationController
  # GET /p/nfc/start
  def start
    # Triggered by NFC Tag (Home)
    # This should behave like creating a session from mobile but requested via GET
    # We need device_id. For NFC tag, maybe we pass it or use a default?
    # Node implementation used "unknown_mobile" or query param?
    # Node: req.query.device_id || 'nfc_tag_user'
    
    device_id = params[:device_id] || 'nfc_tag_user'
    
    # We can reuse SessionsController logic or duplicate it.
    # Duplicating for simplicity in MVP.
    
    user = BanditService.get_or_create_user(device_id)
    result = BanditService.calculate_effective_tau(user.id)
    tau = result[:tau]
    reasoning = result[:reasoning]
    recipe = BanditService.select_recipe(tau)

    # Check if active session exists?
    # For now, just create new.
    
    session = Session.create(
      user_id: user.id,
      proof_type: 'nfc_start',
      started_at: Time.now,
      recipe_id: recipe&.id,
      tau_limit: tau,
      status: 'active'
    )
    
    # Stop summoning if active
    AgentService.instance.stop_summon

    render json: { 
      message: "Session Started via NFC", 
      session_id: session.id,
      recipe: recipe&.title,
      tau: tau
    }
  end

  # GET /p/nfc/done
  def done
    # Triggered by NFC Tag (Bath)
    # We need to find the active session for this user/device?
    # Or session_id via query?
    
    session_id = params[:sid]
    if session_id
        session = Session.find_by(id: session_id)
        if session
            session.update(finished_at: Time.now, status: 'completed', proof_type: 'nfc_done')
            render json: { message: "Session Finished", duration: (session.finished_at - session.started_at) }
            return
        end
    end
    
    render json: { error: "Session not found or sid missing" }, status: 404
  end
end
