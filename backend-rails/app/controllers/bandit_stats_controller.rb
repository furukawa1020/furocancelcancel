class BanditStatsController < ApplicationController
  before_action :set_bandit_stat, only: %i[ show update destroy ]

  # GET /bandit_stats
  def index
    @bandit_stats = BanditStat.all

    render json: @bandit_stats
  end

  # GET /bandit_stats/1
  def show
    render json: @bandit_stat
  end

  # POST /bandit_stats
  def create
    @bandit_stat = BanditStat.new(bandit_stat_params)

    if @bandit_stat.save
      render json: @bandit_stat, status: :created, location: @bandit_stat
    else
      render json: @bandit_stat.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /bandit_stats/1
  def update
    if @bandit_stat.update(bandit_stat_params)
      render json: @bandit_stat
    else
      render json: @bandit_stat.errors, status: :unprocessable_entity
    end
  end

  # DELETE /bandit_stats/1
  def destroy
    @bandit_stat.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_bandit_stat
      @bandit_stat = BanditStat.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def bandit_stat_params
      params.require(:bandit_stat).permit(:user_id, :context, :arm, :alpha, :beta)
    end
end
