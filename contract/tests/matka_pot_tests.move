#[test_only]
module matka_pot::matka_pot_tests {
    use iota::test_scenario::{Self};
    use iota::clock;
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::random::{Self, Random};
    use matka_pot::matka_pot::{Self, AdminCap, GlobalConfig, Game, Ticket};
    use matka_pot::prize;

    const ADMIN: address = @0xAD;
    const PLAYER1: address = @0xB1;
    const PLAYER2: address = @0xB2;
    const PLAYER3: address = @0xB3;

    const MIN_CONTRIBUTION: u64 = 17_200_000_000;
    const MIN_GAME_DURATION_MS: u64 = 86_400_000;
    const LOCKOUT_DURATION_MS: u64 = 600_000;
    const CURRENT_TIME_MS: u64 = 1_000_000;

    // ======================================================
    // Prize calculation tests (pure, no objects needed)
    // ======================================================

    #[test]
    fun test_prize_calculate_1_player() {
        let (p1, p2, p3, t) = prize::calculate(1_000_000_000, 1);
        assert!(p1 == 900_000_000, 0);
        assert!(p2 == 0, 1);
        assert!(p3 == 0, 2);
        assert!(t == 100_000_000, 3);
        assert!(p1 + t == 1_000_000_000, 4);
    }

    #[test]
    fun test_prize_calculate_2_players() {
        let (p1, p2, p3, t) = prize::calculate(1_000_000_000, 2);
        assert!(p1 == 500_000_000, 0);
        assert!(p2 == 400_000_000, 1);
        assert!(p3 == 0, 2);
        assert!(p1 + p2 + t == 1_000_000_000, 3);
    }

    #[test]
    fun test_prize_calculate_3_players() {
        let (p1, p2, p3, t) = prize::calculate(1_000_000_000, 3);
        assert!(p1 == 500_000_000, 0);
        assert!(p2 == 300_000_000, 1);
        assert!(p3 == 100_000_000, 2);
        assert!(p1 + p2 + p3 + t == 1_000_000_000, 3);
    }

    // ======================================================
    // Init test
    // ======================================================

    #[test]
    fun test_init() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // AdminCap must be in ADMIN's inventory
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            test_scenario::return_to_sender(&scenario, cap);
        };

        // GlobalConfig must exist as a shared object
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let config = test_scenario::take_shared<GlobalConfig>(&scenario);
            test_scenario::return_shared(config);
        };

        test_scenario::end(scenario);
    }

    // ======================================================
    // Create game tests
    // ======================================================

    #[test]
    fun test_create_game_valid() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);

        // reveal_ts strictly greater than current + MIN_GAME_DURATION_MS
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        // Game must appear as a shared object
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(&scenario);
            assert!(matka_pot::is_game_active(&game), 0);
            test_scenario::return_shared(game);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_create_game_too_soon() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);

        // reveal_ts == current + MIN_GAME_DURATION_MS (not strictly greater → abort)
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    // ======================================================
    // Add to pot tests
    // ======================================================

    #[test]
    fun test_add_to_pot_success() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            assert!(matka_pot::get_pot_balance(&game) == MIN_CONTRIBUTION, 0);
            assert!(matka_pot::get_unique_player_count(&game) == 1, 1);
            test_scenario::return_shared(game);
        };

        // Ticket must be in PLAYER1's inventory
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let ticket = test_scenario::take_from_sender<Ticket>(&scenario);
            test_scenario::return_to_sender(&scenario, ticket);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_add_to_pot_below_minimum() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION - 1, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(game);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)]
    fun test_add_to_pot_during_lockout() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        // lockout_timestamp_ms = reveal_ts - LOCKOUT_DURATION_MS
        // The check is: clock < lockout_timestamp_ms → allowed
        // Setting clock to exactly lockout_timestamp_ms triggers EGameLocked
        let lockout_ts = reveal_ts - LOCKOUT_DURATION_MS;
        clock::set_for_testing(&mut clock, lockout_ts);

        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(game);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    // ======================================================
    // Unique player deduplication test
    // ======================================================

    #[test]
    fun test_unique_player_dedup() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        // First contribution from PLAYER1
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            assert!(matka_pot::get_unique_player_count(&game) == 1, 0);
            test_scenario::return_shared(game);
        };

        // Second contribution from the same PLAYER1 — still 1 unique entry
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            assert!(matka_pot::get_unique_player_count(&game) == 1, 0);
            assert!(matka_pot::get_pot_balance(&game) == MIN_CONTRIBUTION * 2, 1);
            test_scenario::return_shared(game);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    // ======================================================
    // Reveal winner tests
    // ======================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_reveal_too_early() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Random must be created by the system address @0x0
        test_scenario::next_tx(&mut scenario, @0x0);
        {
            random::create_for_testing(test_scenario::ctx(&mut scenario));
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                MIN_CONTRIBUTION, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(game);
        };

        // Clock is still at CURRENT_TIME_MS (before reveal_ts) → ETooEarly
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let rand = test_scenario::take_shared<Random>(&scenario);
            let config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::reveal_winners_for_testing(
                &mut game, &rand, &clock, &config,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(rand);
            test_scenario::return_shared(config);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_1_player_prize_distribution() {
        // Must be >= min_contribution (17_200_000_000 nanos)
        let total_pot: u64 = MIN_CONTRIBUTION;

        let mut scenario = test_scenario::begin(ADMIN);
        {
            matka_pot::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Create and seed the Random shared object
        test_scenario::next_tx(&mut scenario, @0x0);
        {
            random::create_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, @0x0);
        {
            let mut rand = test_scenario::take_shared<Random>(&scenario);
            // First randomness update must use round 0 (before any bytes have been set)
            random::update_randomness_state_for_testing(
                &mut rand,
                0,
                x"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(rand);
        };

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, CURRENT_TIME_MS);
        let reveal_ts = CURRENT_TIME_MS + MIN_GAME_DURATION_MS + 1;

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::create_game(
                &cap, &mut config, &clock, reveal_ts,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_shared(config);
        };

        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let payment = coin::mint_for_testing<IOTA>(
                total_pot, test_scenario::ctx(&mut scenario),
            );
            matka_pot::add_to_pot(
                &mut game, payment, vector[], &clock,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_shared(game);
        };

        // Advance clock past reveal deadline
        clock::set_for_testing(&mut clock, reveal_ts + 1);

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let rand = test_scenario::take_shared<Random>(&scenario);
            let config = test_scenario::take_shared<GlobalConfig>(&scenario);
            matka_pot::reveal_winners_for_testing(
                &mut game, &rand, &clock, &config,
                test_scenario::ctx(&mut scenario),
            );
            assert!(!matka_pot::is_game_active(&game), 0);
            test_scenario::return_shared(game);
            test_scenario::return_shared(rand);
            test_scenario::return_shared(config);
        };

        // PLAYER1 (sole winner) receives 90% of the pot
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let prize = test_scenario::take_from_sender<Coin<IOTA>>(&scenario);
            let expected = total_pot - total_pot / 10; // 90%
            assert!(coin::value(&prize) == expected, 1);
            test_scenario::return_to_sender(&scenario, prize);
        };

        // ADMIN is also the treasury (set during init), receives 10%
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let treasury = test_scenario::take_from_sender<Coin<IOTA>>(&scenario);
            let expected = total_pot / 10; // 10%
            assert!(coin::value(&treasury) == expected, 2);
            test_scenario::return_to_sender(&scenario, treasury);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
