module matka_pot::matka_pot {
    use iota::balance::{Self, Balance};
    use iota::clock::Clock;
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::object::{Self, UID};
    use iota::random::{Self, Random};
    use iota::table::{Self, Table};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::vec_set::{Self, VecSet};
    use std::hash;
    use std::option::{Self, Option};
    use std::vector;
    use matka_pot::events;
    use matka_pot::prize;

    const ENotEnoughTime: u64 = 1;
    const EGameNotActive: u64 = 2;
    const EBelowMinimum: u64 = 3;
    const EGameLocked: u64 = 4;
    const ETooEarly: u64 = 5;
    const ENotEnoughPlayers: u64 = 6;

    const MIN_GAME_DURATION_MS: u64 = 86_400_000;
    const LOCKOUT_DURATION_MS: u64 = 600_000;

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct GlobalConfig has key {
        id: UID,
        admin_address: address,
        treasury_address: address,
        game_counter: u64,
        min_contribution_nanos: u64,
    }

    public struct Game has key {
        id: UID,
        game_id: u64,
        pot_balance: Balance<IOTA>,
        min_contribution_nanos: u64,
        entries: VecSet<address>,
        contributions: Table<address, u64>,
        accumulated_entropy: vector<u8>,
        created_at_ms: u64,
        reveal_timestamp_ms: u64,
        lockout_timestamp_ms: u64,
        is_active: bool,
        revealed_at_ms: Option<u64>,
        winner_1: Option<address>,
        winner_2: Option<address>,
        winner_3: Option<address>,
        prize_1_nanos: u64,
        prize_2_nanos: u64,
        prize_3_nanos: u64,
        treasury_cut_nanos: u64,
    }

    public struct Ticket has key, store {
        id: UID,
        game_id: u64,
        player: address,
        amount_nanos: u64,
        contributed_at_ms: u64,
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        let config = GlobalConfig {
            id: object::new(ctx),
            admin_address: tx_context::sender(ctx),
            treasury_address: tx_context::sender(ctx),
            game_counter: 0,
            min_contribution_nanos: 17_200_000_000,
        };
        transfer::share_object(config);
    }

    public entry fun create_game(
        _cap: &AdminCap,
        config: &mut GlobalConfig,
        clock: &Clock,
        reveal_timestamp_ms: u64,
        ctx: &mut TxContext,
    ) {
        assert!(
            reveal_timestamp_ms > clock.timestamp_ms() + MIN_GAME_DURATION_MS,
            ENotEnoughTime,
        );

        config.game_counter = config.game_counter + 1;
        let game_id = config.game_counter;
        let created_at_ms = clock.timestamp_ms();
        let lockout_timestamp_ms = reveal_timestamp_ms - LOCKOUT_DURATION_MS;

        let game = Game {
            id: object::new(ctx),
            game_id,
            pot_balance: balance::zero(),
            min_contribution_nanos: config.min_contribution_nanos,
            entries: vec_set::empty(),
            contributions: table::new(ctx),
            accumulated_entropy: vector::empty(),
            created_at_ms,
            reveal_timestamp_ms,
            lockout_timestamp_ms,
            is_active: true,
            revealed_at_ms: option::none(),
            winner_1: option::none(),
            winner_2: option::none(),
            winner_3: option::none(),
            prize_1_nanos: 0,
            prize_2_nanos: 0,
            prize_3_nanos: 0,
            treasury_cut_nanos: 0,
        };

        let game_object_id = object::uid_to_inner(&game.id);
        events::emit_game_created(
            game_id,
            game_object_id,
            reveal_timestamp_ms,
            lockout_timestamp_ms,
            config.min_contribution_nanos,
            created_at_ms,
        );

        transfer::share_object(game);
    }

    public entry fun add_to_pot(
        game: &mut Game,
        payment: Coin<IOTA>,
        user_entropy: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(coin::value(&payment) >= game.min_contribution_nanos, EBelowMinimum);
        assert!(clock.timestamp_ms() < game.lockout_timestamp_ms, EGameLocked);

        let amount = coin::value(&payment);
        balance::join(&mut game.pot_balance, coin::into_balance(payment));

        let sender = tx_context::sender(ctx);
        if (!vec_set::contains(&game.entries, &sender)) {
            vec_set::insert(&mut game.entries, sender);
        };

        if (table::contains(&game.contributions, sender)) {
            let existing = table::borrow_mut(&mut game.contributions, sender);
            *existing = *existing + amount;
        } else {
            table::add(&mut game.contributions, sender, amount);
        };

        if (!vector::is_empty(&user_entropy)) {
            let mut combined = game.accumulated_entropy;
            vector::append(&mut combined, user_entropy);
            game.accumulated_entropy = hash::sha3_256(combined);
        };

        let ticket_uid = object::new(ctx);
        let ticket_object_id = object::uid_to_inner(&ticket_uid);
        let ticket = Ticket {
            id: ticket_uid,
            game_id: game.game_id,
            player: sender,
            amount_nanos: amount,
            contributed_at_ms: clock.timestamp_ms(),
        };
        transfer::public_transfer(ticket, sender);

        let total_pot_nanos = balance::value(&game.pot_balance);
        let unique_player_count = vec_set::size(&game.entries);

        events::emit_ticket_issued(
            game.game_id,
            sender,
            amount,
            total_pot_nanos,
            unique_player_count,
            ticket_object_id,
        );
    }

    entry fun reveal_winners(
        game: &mut Game,
        rand: &Random,
        clock: &Clock,
        config: &GlobalConfig,
        ctx: &mut TxContext,
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(clock.timestamp_ms() >= game.reveal_timestamp_ms, ETooEarly);

        let unique_count = vec_set::size(&game.entries);
        assert!(unique_count >= 1, ENotEnoughPlayers);

        let total_pot = balance::value(&game.pot_balance);

        let mut generator = random::new_generator(rand, ctx);

        let players = *vec_set::keys(&game.entries);

        let (p1_amount, p2_amount, p3_amount, treasury_amount) =
            prize::calculate(total_pot, unique_count);

        let winner_1_addr: address;
        let winner_2_opt: Option<address>;
        let winner_3_opt: Option<address>;

        if (unique_count == 1) {
            winner_1_addr = *vector::borrow(&players, 0);
            winner_2_opt = option::none();
            winner_3_opt = option::none();
        } else if (unique_count == 2) {
            let idx = random::generate_u64_in_range(&mut generator, 0, 1);
            winner_1_addr = *vector::borrow(&players, idx);
            let w2_idx = if (idx == 0) { 1 } else { 0 };
            winner_2_opt = option::some(*vector::borrow(&players, w2_idx));
            winner_3_opt = option::none();
        } else {
            let mut candidates = *vec_set::keys(&game.entries);
            let n = vector::length(&candidates);

            let idx1 = random::generate_u64_in_range(&mut generator, 0, n - 1);
            winner_1_addr = *vector::borrow(&candidates, idx1);
            vector::remove(&mut candidates, idx1);

            let n2 = vector::length(&candidates);
            let idx2 = random::generate_u64_in_range(&mut generator, 0, n2 - 1);
            let w2 = *vector::borrow(&candidates, idx2);
            winner_2_opt = option::some(w2);
            vector::remove(&mut candidates, idx2);

            let n3 = vector::length(&candidates);
            let idx3 = random::generate_u64_in_range(&mut generator, 0, n3 - 1);
            let w3 = *vector::borrow(&candidates, idx3);
            winner_3_opt = option::some(w3);
        };

        let prize1_coin = coin::from_balance(
            balance::split(&mut game.pot_balance, p1_amount),
            ctx,
        );
        transfer::public_transfer(prize1_coin, winner_1_addr);

        if (option::is_some(&winner_2_opt)) {
            let w2 = *option::borrow(&winner_2_opt);
            let prize2_coin = coin::from_balance(
                balance::split(&mut game.pot_balance, p2_amount),
                ctx,
            );
            transfer::public_transfer(prize2_coin, w2);
        };

        if (option::is_some(&winner_3_opt)) {
            let w3 = *option::borrow(&winner_3_opt);
            let prize3_coin = coin::from_balance(
                balance::split(&mut game.pot_balance, p3_amount),
                ctx,
            );
            transfer::public_transfer(prize3_coin, w3);
        };

        let treasury_balance = balance::withdraw_all(&mut game.pot_balance);
        let treasury_coin = coin::from_balance(treasury_balance, ctx);
        transfer::public_transfer(treasury_coin, config.treasury_address);

        let revealed_at_ms = clock.timestamp_ms();

        game.winner_1 = option::some(winner_1_addr);
        game.winner_2 = winner_2_opt;
        game.winner_3 = winner_3_opt;
        game.prize_1_nanos = p1_amount;
        game.prize_2_nanos = p2_amount;
        game.prize_3_nanos = p3_amount;
        game.treasury_cut_nanos = treasury_amount;
        game.is_active = false;
        game.revealed_at_ms = option::some(revealed_at_ms);

        events::emit_winners_revealed(
            game.game_id,
            unique_count,
            winner_1_addr,
            p1_amount,
            winner_2_opt,
            p2_amount,
            winner_3_opt,
            p3_amount,
            config.treasury_address,
            treasury_amount,
            revealed_at_ms,
        );
    }

    public entry fun update_treasury_address(
        _cap: &AdminCap,
        config: &mut GlobalConfig,
        new_address: address,
        _ctx: &mut TxContext,
    ) {
        events::emit_treasury_updated(config.treasury_address, new_address);
        config.treasury_address = new_address;
    }

    public entry fun update_min_contribution(
        _cap: &AdminCap,
        config: &mut GlobalConfig,
        new_min: u64,
        _ctx: &mut TxContext,
    ) {
        events::emit_min_contribution_updated(config.min_contribution_nanos, new_min);
        config.min_contribution_nanos = new_min;
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun reveal_winners_for_testing(
        game: &mut Game,
        rand: &random::Random,
        clock: &Clock,
        config: &GlobalConfig,
        ctx: &mut TxContext,
    ) {
        reveal_winners(game, rand, clock, config, ctx)
    }

    #[test_only]
    public fun get_unique_player_count(game: &Game): u64 {
        vec_set::size(&game.entries)
    }

    #[test_only]
    public fun get_pot_balance(game: &Game): u64 {
        balance::value(&game.pot_balance)
    }

    #[test_only]
    public fun is_game_active(game: &Game): bool {
        game.is_active
    }
}
