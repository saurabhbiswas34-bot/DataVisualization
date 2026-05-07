module matka_pot::prize {

    /// Returns (prize_1, prize_2, prize_3, treasury_cut) in NANOS
    /// All values are from gross total_pot (sum = total_pot)
    /// 1 player:  90% / 0 / 0 / 10%
    /// 2 players: 50% / 40% / 0 / 10%
    /// 3+ players: 50% / 30% / 10% / 10%
    public fun calculate(total_pot: u64, unique_count: u64): (u64, u64, u64, u64) {
        let treasury = total_pot / 10; // 10%
        if (unique_count == 1) {
            let p1 = total_pot - treasury;
            (p1, 0, 0, treasury)
        } else if (unique_count == 2) {
            let p1 = total_pot / 2;           // 50%
            let p2 = (total_pot * 40) / 100;  // 40%
            let t  = total_pot - p1 - p2;     // remainder → treasury (~10%)
            (p1, p2, 0, t)
        } else {
            let p1 = total_pot / 2;           // 50%
            let p2 = (total_pot * 30) / 100;  // 30%
            let p3 = total_pot / 10;          // 10%
            let t  = total_pot - p1 - p2 - p3;// remainder → treasury (~10%)
            (p1, p2, p3, t)
        }
    }
}
