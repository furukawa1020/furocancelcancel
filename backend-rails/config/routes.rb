Rails.application.routes.draw do
  get '/up', to: proc { [200, {}, ['OK']] }
  resources :bandit_stats
  resources :sessions do
    member do
      post 'feedback'
    end
    collection do
      get 'history'
      get 'current'
    end
  end

  # NFC Routes
  get 'p/nfc/start', to: 'nfc#start'
  get 'p/nfc/done', to: 'nfc#done'
  
  # Summon Routes
  post 'summon', to: 'summon#trigger'
  get 'summon/status', to: 'summon#status'
  post 'summon/stop', to: 'summon#stop'
  resources :users
  resources :recipes
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
