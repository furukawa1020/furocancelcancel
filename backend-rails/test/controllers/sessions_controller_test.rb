require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @session = sessions(:one)
  end

  test "should get index" do
    get sessions_url, as: :json
    assert_response :success
  end

  test "should create session" do
    assert_difference("Session.count") do
      post sessions_url, params: { session: { ends_at: @session.ends_at, feedback: @session.feedback, finished_at: @session.finished_at, proof_type: @session.proof_type, recipe_id: @session.recipe_id, started_at: @session.started_at, status: @session.status, user_id: @session.user_id } }, as: :json
    end

    assert_response :created
  end

  test "should show session" do
    get session_url(@session), as: :json
    assert_response :success
  end

  test "should update session" do
    patch session_url(@session), params: { session: { ends_at: @session.ends_at, feedback: @session.feedback, finished_at: @session.finished_at, proof_type: @session.proof_type, recipe_id: @session.recipe_id, started_at: @session.started_at, status: @session.status, user_id: @session.user_id } }, as: :json
    assert_response :success
  end

  test "should destroy session" do
    assert_difference("Session.count", -1) do
      delete session_url(@session), as: :json
    end

    assert_response :no_content
  end
end
