require "test_helper"

class BanditStatsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @bandit_stat = bandit_stats(:one)
  end

  test "should get index" do
    get bandit_stats_url, as: :json
    assert_response :success
  end

  test "should create bandit_stat" do
    assert_difference("BanditStat.count") do
      post bandit_stats_url, params: { bandit_stat: { alpha: @bandit_stat.alpha, arm: @bandit_stat.arm, beta: @bandit_stat.beta, context: @bandit_stat.context, user_id: @bandit_stat.user_id } }, as: :json
    end

    assert_response :created
  end

  test "should show bandit_stat" do
    get bandit_stat_url(@bandit_stat), as: :json
    assert_response :success
  end

  test "should update bandit_stat" do
    patch bandit_stat_url(@bandit_stat), params: { bandit_stat: { alpha: @bandit_stat.alpha, arm: @bandit_stat.arm, beta: @bandit_stat.beta, context: @bandit_stat.context, user_id: @bandit_stat.user_id } }, as: :json
    assert_response :success
  end

  test "should destroy bandit_stat" do
    assert_difference("BanditStat.count", -1) do
      delete bandit_stat_url(@bandit_stat), as: :json
    end

    assert_response :no_content
  end
end
