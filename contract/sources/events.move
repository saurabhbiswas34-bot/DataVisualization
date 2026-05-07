module matka_pot::events {
    use iota::event;
    use iota::object::ID;
    use std::option::Option;

    public struct GameCreated has copy, drop {
        game_id: u64,
        reveal_timestamp_ms: u64,
        lockout_timestamp_ms: u64,
        min_contribution_nanos: u64,
        created_at_ms: u64,
    }

    public struct TicketIssued has copy, drop {
        game_id: u64,
        player: address,
        amount_nanos: u64,
        total_pot_nanos: u64,
        unique_player_count: u64,
        ticket_object_id: ID,
    }

    public struct WinnersRevealed has copy, drop {
        game_id: u64,
        unique_players: u64,
        winner_1: address,
        prize_1_nanos: u64,
        winner_2: Option<address>,
        prize_2_nanos: u64,
        winner_3: Option<address>,
        prize_3_nanos: u64,
        treasury_address: address,
        treasury_cut_nanos: u64,
        revealed_at_ms: u64,
    }

    public struct TreasuryUpdated has copy, drop {
        old_address: address,
        new_address: address,
    }

    public struct MinContributionUpdated has copy, drop {
        old_nanos: u64,
        new_nanos: u64,
    }

    public fun emit_game_created(
        game_id: u64,
        reveal_timestamp_ms: u64,
        lockout_timestamp_ms: u64,
        min_contribution_nanos: u64,
        created_at_ms: u64,
    ) {
        event::emit(GameCreated {
            game_id,
            reveal_timestamp_ms,
            lockout_timestamp_ms,
            min_contribution_nanos,
            created_at_ms,
        });
    }

    public fun emit_ticket_issued(
        game_id: u64,
        player: address,
        amount_nanos: u64,
        total_pot_nanos: u64,
        unique_player_count: u64,
        ticket_object_id: ID,
    ) {
        event::emit(TicketIssued {
            game_id,
            player,
            amount_nanos,
            total_pot_nanos,
            unique_player_count,
            ticket_object_id,
        });
    }

    public fun emit_winners_revealed(
        game_id: u64,
        unique_players: u64,
        winner_1: address,
        prize_1_nanos: u64,
        winner_2: Option<address>,
        prize_2_nanos: u64,
        winner_3: Option<address>,
        prize_3_nanos: u64,
        treasury_address: address,
        treasury_cut_nanos: u64,
        revealed_at_ms: u64,
    ) {
        event::emit(WinnersRevealed {
            game_id,
            unique_players,
            winner_1,
            prize_1_nanos,
            winner_2,
            prize_2_nanos,
            winner_3,
            prize_3_nanos,
            treasury_address,
            treasury_cut_nanos,
            revealed_at_ms,
        });
    }

    public fun emit_treasury_updated(old_address: address, new_address: address) {
        event::emit(TreasuryUpdated { old_address, new_address });
    }

    public fun emit_min_contribution_updated(old_nanos: u64, new_nanos: u64) {
        event::emit(MinContributionUpdated { old_nanos, new_nanos });
    }
}
