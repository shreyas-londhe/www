# WTF is SPARK

## 1. Introduction

### 1.1 What is SPARK?

SPARK (Scalable Polynomial Argument of Knowledge) is a zkSNARK for efficiently committing to and proving evaluations of sparse polynomials and matrices. It was introduced as an optimization to the Spartan protocol, specifically targeting scenarios where constraint system matrices are sparse.

**In the zkSNARK pipeline:**

- Spartan proves R1CS satisfaction: $(A·z) ∘ (B·z) = C·z$
- This requires committing to and evaluating sparse matrices $A$, $B$, $C$
- Standard polynomial commitments treat matrices densely
- SPARK provides a commitment scheme optimized for sparsity, achieving $O(nnz)$ complexity

**Key property:** SPARK's prover and commitment costs scale with the number of non-zero entries (nnz), not the total matrix dimensions ($m \times n$).

### 1.2 Why SPARK?

**The Dense Evaluation Bottleneck:**

In standard approaches to proving R1CS, evaluating matrix MLEs at random points requires iterating over all positions:

$$\tilde{M}(r_x, r_y) = \sum_{i=0}^{m-1} \sum_{j=0}^{n-1} M[i,j] \cdot eq(i, r_x) \cdot eq(j, r_y)$$

- **Dense approach cost:** O(m·n)
- **Problem:** For sparse matrices, most M[i,j] = 0
- **Example:** A 1024×1024 matrix with 4096 non-zeros processes 1M positions when only 4K are meaningful

**SPARK's Improvement:**

SPARK processes only the non-zero entries, trading dense iteration for sparse memory checking:

- Iterate over nnz entries (not m×n)
- Use memory-checking protocol to prove correctness
- Polynomial commitment overhead scales with padded nnz

**When to use SPARK:**

Use SPARK when matrices are sufficiently sparse that the memory-checking overhead is worthwhile compared to dense evaluation.

### 1.3 High-Level Intuition

**The Core Insight:**

Instead of iterating over all positions to compute the sum, SPARK treats the eq polynomial evaluations as a **virtual memory**:

- **Addresses:** row and column indices
- **Values:** eq(row, rx) and eq(col, ry)
- **Operations:** "read" the eq value for each non-zero entry's position

**The Trade:**

- ✅ Only process nnz entries (not m·n)
- ⚠️ Must prove we read the correct memory values
- ✅ Use offline memory checking with timestamps

**Memory Checking in One Sentence:**

Prove that every memory read corresponds to a valid write by tracking access timestamps and using a grand product argument to verify consistency.

**Protocol Flow Overview:**

1. **Sumcheck:** Prove $\sum_{i} val[i] \cdot memory\_row[i] \cdot memory\_col[i] = claimed\_value$ over non-zeros
2. **Memory Check:** Prove the memory_row and memory_col values are correct using timestamps
3. **Grand Product Argument:** Verify read-write consistency through fingerprint products

The magic: We've replaced O(m·n) dense iteration with O(nnz) sparse lookups + memory checking overhead.

---

---

## 2. Prerequisites & Notation

- **2.1 Assumed Knowledge**
  - Multilinear Extensions (MLEs)
  - Sumcheck Protocol
  - Equality polynomial (eq)
  - Polynomial commitments (WHIR in this implementation)
  - Fiat-Shamir transform

- **2.2 Notation**
  - R1CS: `(A·z) ∘ (B·z) = C·z`
  - Matrix dimensions: m constraints × n variables
  - nnz: number of non-zero entries
  - Coordinate format (COO): `(row, col, val)` tuples

## 3. The Core Problem: Sparse Matrix-Vector Multiplication

- **3.1 What We Need to Prove**
  - For a matrix A evaluated at random point (rx, ry):
  - `Ã(rx, ry) = Σᵢⱼ A[i,j] · eq(i, rx) · eq(j, ry)`
- **3.2 Why Dense Evaluation is Expensive**
  - Requires iterating over all m×n positions
  - Most are zeros in sparse matrices
  - Prover cost: O(m·n) field operations

- **3.3 SPARK's Approach**
  - Only process non-zero entries: O(nnz)
  - Use memory-checking to prove correctness
  - Trade dense iteration for timestamp management

## 4. Offline Memory Checking Primitive

- **4.1 The Memory Checking Abstraction**
  - Virtual memory with addresses and values
  - Read-set (RS) and Write-set (WS)
  - Invariant: Every read must have a prior write

- **4.2 Fingerprinting Technique**
  - Fingerprint = `(address·γ² + value·γ + timestamp) - τ`
  - Random challenges γ, τ from Fiat-Shamir
  - Why this encoding prevents forgery

- **4.3 Product Argument**
  - Claim: `∏ init_fingerprints · ∏ WS_fingerprints = ∏ RS_fingerprints · ∏ final_fingerprints`
  - Init: all timestamps = 0
  - Final: timestamps = total access count per address
  - Proves read-write consistency

## 5. SPARK Protocol: Step-by-Step

- **5.1 Setup Phase**
  - Convert R1CS matrices to COO format
  - Pad to power-of-2 length
  - Compute timestamps for each access
- **5.2 Memory Structure**
  - Row memory: addresses = row indices
  - Column memory: addresses = column indices
  - Memory values = eq polynomial evaluations (`eq_rx`, `eq_ry`)

- **5.3 Timestamp Calculation**
  - `read_row[i]` = number of times row accessed before entry i
  - `read_col[i]` = number of times col accessed before entry i
  - `final_row[addr]` = total times row addr accessed
  - `final_col[addr]` = total times col addr accessed

- **5.4 Main Protocol Flow**

  ```
  Phase 1: Matrix Sumcheck
    - Prove: Σ val[i]·eq_rx[i]·eq_ry[i] = claimed_value
    - Evaluates the sparse matrix at (rx, ry)

  Phase 2: Row Memory Checking
    - Init-Final GPA: Prove row memory consistency
    - RS-WS GPA: Prove each read has write

  Phase 3: Column Memory Checking
    - Init-Final GPA: Prove col memory consistency
    - RS-WS GPA: Prove each read has write
  ```

## 6. Detailed Protocol Components

### 6.1 Matrix Sumcheck

- **Equation**: `Σᵢ val[i] · eq_rx[i] · eq_ry[i] = claimed_value`
- **Why it works**: Sparse representation of dense sum
- **Implementation**: Cubic sumcheck with Lasso optimization

### 6.2 Grand Product Argument (GPA)

- **Purpose**: Prove product equality via multilinear extension
- **Binary Tree Construction**:
  - Build layers: `[a,b,c,d] → [ab, cd] → [abcd]`
  - Prove each layer via sumcheck
- **Output**: Random evaluation point for final check

### 6.3 Init-Final Memory Check

- **Row side**:
  - Init fingerprints: `(addr·γ² + eq_rx[addr]·γ + 0) - τ`
  - Final fingerprints: `(addr·γ² + eq_rx[addr]·γ + final_row[addr]) - τ`
  - GPA proves: `∏ init · ∏ final` relationship

- **Column side**: (similar with `eq_ry` and `final_col`)

### 6.4 Read-Set / Write-Set Check

- **Read-Set**: `(row[i]·γ² + eq_rx[i]·γ + read_row[i]) - τ`
- **Write-Set**: `(row[i]·γ² + eq_rx[i]·γ + read_row[i] + 1) - τ`
- **Invariant**: WS timestamp = RS timestamp + 1
- **GPA proves**: `∏ init · ∏ WS = ∏ RS · ∏ final`

## 7. The Equality Polynomial Trick

- **7.1 Why eq_rx and eq_ry?**
  - `eq_rx[addr]` = selector for row index rx
  - Evaluated over boolean hypercube of row addresses
  - Acts as "memory value" in fingerprints

- **7.2 Column Dimension Mismatch**
  - `col` has n+1 dimensions vs row's n dimensions
  - `eq_ry = eq(col[1..]) · (1 - col[0])`
  - First bit acts as enable/disable selector

## 8. Implementation Walkthrough

- **8.1 Prover Side** (`spark-prover/src/spark.rs`)
  - Commitment phase (lines 37-60)
  - Sumcheck protocol (lines 62-114)
  - GPA for row/col (lines 116-221)
  - WHIR batched opening

- **8.2 Verifier Side** (`spark-verifier.rs`)
  - Matrix batching (lines 62-74)
  - Sumcheck verification
  - GPA verification
  - Cross-checks between components

- **8.3 Key Data Structures**
  - `SparkMatrix`: COO + timestamps
  - `Memory`: eq_rx, eq_ry vectors
  - `EValues`: looked-up memory values per matrix entry

## 9. Optimizations

- **9.1 Matrix Batching**
  - Combine A, B, C with random linear combination β
  - Prove `A(rx,ry) + β·B(rx,ry) + β²·C(rx,ry)` in one sumcheck
  - Saves 2 sumcheck protocols

- **9.2 Potential Circuit Optimizations**
  - Row-Column GPA batching with RLC
  - Commitment merging strategies
  - WHIR opening batching
  - Expected savings: 25-35% constraint reduction

## 10. Security Analysis

- **10.1 Soundness Argument**
  - Schwartz-Zippel lemma for polynomial checks
  - Fingerprint collision probability
  - Fiat-Shamir security

- **10.2 Why Timestamps Prevent Cheating**
  - Temporal ordering enforcement
  - No reuse without detection
  - Product argument binding

## 11. Comparison with Alternatives

| Approach         | Prover Time     | Verifier Time | Proof Size  |
| ---------------- | --------------- | ------------- | ----------- |
| Dense Evaluation | O(m·n)          | O(log(m·n))   | O(log(m·n)) |
| SPARK            | O(nnz·log(nnz)) | O(log(nnz))   | O(log(nnz)) |
| Lasso (lookup)   | O(nnz)          | O(log(N))     | O(log(N))   |

## 12. Common Pitfalls & FAQs

- **Q: Why separate row and column memory?**
- **Q: What happens if matrix is dense?**
- **Q: How does padding affect security?**
- **Q: Why can't we batch commitments with RLC?**

## 13. References

- [Spartan Paper] - Original R1CS protocol
- [Lasso Paper] - Lookup arguments and SPARK
- [WHIR Paper] - Polynomial commitment scheme
- [Implementation] - This codebase

## Appendices

### Appendix A: Worked Example

- Complete trace with small matrix (4×4, 8 non-zeros)
- All intermediate values shown

### Appendix B: Notation Reference

- Quick lookup table for all symbols

### Appendix C: Code Map

- File-by-file guide to implementation
