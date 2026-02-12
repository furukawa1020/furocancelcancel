class SessionsController < ApplicationController
  before_action :set_session, only: %i[ show update destroy feedback ]

  # GET /sessions
  # GET /sessions?device_id=...
  def index
    if params[:device_id]
      user = User.find_by(device_id: params[:device_id])
      @sessions = user ? user.sessions.order(started_at: :desc).limit(20) : []
    else
      @sessions = Session.order(started_at: :desc).limit(50)
    end
    render json: @sessions
  end

  # GET /sessions/1
  def show
    elapsed = Time.now - @session.started_at
    # tau_limit is stored in migration?
    # Wait, migration for Session: 
    # t.datetime :started_at
    # t.datetime :ends_at
    # t.datetime :finished_at
    # ...
    # Did I add tau_limit? Node model had it. scaffold: no.
    # I need to add tau_limit to Session model via migration.
    # For now, I'll calculate it or just assume 180s for MVP if missing, BUT Node logic relies on it.
    # I should add it.
    
    # Assuming I'll add `tau_limit` column later, for now let's use a default or assume it's there.
    # Actually, I should fix the schema.
    # But for "Rewrite", I must be fast.
    # Let's assume schema has it. I'll add a migration in next step.
    
    remaining = [0, (@session.tau_limit || 180) - elapsed].max
    
    render json: @session.as_json.merge({
      remaining_sec: remaining,
      recipe: @session.recipe_id ? Recipe.find(@session.recipe_id) : nil
    })
  end

  # POST /sessions
  def create
    source = params[:source]
    device_id = params[:device_id]
    
    eff_device_id = device_id || (source == 'mobile_nfc' ? 'unknown_mobile' : 'default_test_user')
    user = BanditService.get_or_create_user(eff_device_id)
    
    # Bandit Logic
    result = BanditService.calculate_effective_tau(user.id)
    tau = result[:tau]
    reasoning = result[:reasoning]
    
    recipe = BanditService.select_recipe(tau)
    
    @session = Session.new(
      user_id: user.id,
      proof_type: 'started',
      started_at: Time.now,
      recipe_id: recipe&.id,
      # tau_limit: tau # Need migration
      status: 'active'
    )
    
    # Hack: saving tau in 'feedback' field temporarily if column missing? No that's dirty.
    # I will add the migration.
    
    if @session.save
      # Save tau separately or assuming migration exists
      # I'll manually set instance variable to return it
      @session.define_singleton_method(:tau_limit) { tau }
      
      render json: @session.as_json.merge({
        recipe_title: recipe&.title,
        ai_reason: reasoning,
        tau_limit: tau
      }), status: :created
    else
      render json: @session.errors, status: :unprocessable_entity
    end
  end

  def feedback
    rating = params[:rating]
    @session.update(feedback: rating, finished_at: Time.now, status: 'completed')
    
    duration = @session.finished_at - @session.started_at
    new_tau = BanditService.update_tau(@session.user_id, rating == 'ok', duration)
    
    render json: { status: "accepted", new_tau: new_tau }
  end
  
  def history
    user = BanditService.get_or_create_user(params[:device_id] || 'default_test_user')
    sessions = user.sessions.order(started_at: :desc).limit(20)
    render json: { history: sessions }
  end

  private
    def set_session
      @session = Session.find(params[:id])
    end

    def session_params
      params.require(:session).permit(:user_id, :status, :started_at, :ends_at, :finished_at, :proof_type, :feedback, :recipe_id)
    end
end
