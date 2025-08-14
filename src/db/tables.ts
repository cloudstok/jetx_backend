export const lobbies = `CREATE TABLE IF NOT EXISTS lobbies (
  id INT NOT NULL AUTO_INCREMENT,
   lobby_id BIGINT NOT NULL,
   start_delay INT NOT NULL,
   end_delay INT NOT NULL,
   max_mult DECIMAL(10, 2) NOT NULL,
   client_seeds json not null,
   server_seed varchar(32) not null,
   hash varchar(128) not null,
   created_at datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY USING BTREE (id),
   index idx_lobby (lobby_id) USING BTREE
 );`

export const bets = `CREATE TABLE IF NOT EXISTS bets (
  id INT NOT NULL AUTO_INCREMENT,
   bet_id varchar(255) NOT NULL,
   lobby_id varchar(255) NOT NULL,
   name varchar(255) NOT NULL,
   user_id  varchar(255) NOT NULL,
   operator_id varchar(255) DEFAULT NULL,
   bet_amount decimal(10, 2) NOT NULL DEFAULT 0.00,
   auto_cashout  DECIMAL(10, 2) DEFAULT NULL,
   avatar INT NOT NULL,
   hash varchar(255) not null,
   PRIMARY KEY USING BTREE (id),
   created_at datetime DEFAULT CURRENT_TIMESTAMP
 );`


export const settlement = `CREATE TABLE IF NOT EXISTS settlement (
   id int AUTO_INCREMENT,
   bet_id varchar(255) DEFAULT NULL,
   lobby_id varchar(255) DEFAULT NULL,
   name varchar(255) NOT NULL,
   user_id varchar(255) DEFAULT NULL,
   operator_id varchar(255) DEFAULT NULL,
   hash varchar(255) not null,
   bet_amount decimal(10, 2) NOT NULL DEFAULT 0.00,
   auto_cashout DECIMAL(10, 2) DEFAULT NULL,
   avatar INT NOT NULL,
   max_mult DECIMAL(10, 2) NOT NULL default 0.00,
   win_amount decimal(10, 2) NOT NULL default 0.00,
   status enum('cashout', 'crashed') DEFAULT 'crashed',
   created_at datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY USING BTREE (id),
   index idx_user_operator (user_id, operator_id) USING BTREE,
   index idx_user_operator_lobby (user_id, operator_id, lobby_id) USING BTREE
);`

export const roundStats = ` CREATE TABLE IF NOT EXISTS round_stats (
  id INT NOT NULL AUTO_INCREMENT,
   lobby_id BIGINT NOT NULL,
   start_time BIGINT DEFAULT NULL,
   max_mult DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
   end_time BIGINT NOT NULL,
   total_bets INT NOT NULL,
   total_players INT DEFAULT NULL,
   total_bet_amount decimal(10, 2) DEFAULT 0.00,
   total_cashout_amount decimal(10, 2) DEFAULT 0.00,
   biggest_winner decimal(10, 2) DEFAULT 0.00,
   biggest_looser decimal(10, 2) DEFAULT 0.00,
   total_round_settled decimal(10, 2) DEFAULT 0.00,
   created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY USING BTREE (id),
   index idx_lobby (lobby_id) USING BTREE
 );`

export const user_messages = `CREATE TABLE user_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    operator_id varchar(255) DEFAULT NULL,
    avatar INT not null,
    name VARCHAR(255) default null,
    msg TEXT,
    gif varchar(255) DEFAULT null,
    user_likes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`