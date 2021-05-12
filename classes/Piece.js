const { PIECE_TYPES, COLOUR } = require("./enums");
const _ = require("lodash");

// CURRENT BUGS //
// Castling logic implemented wrong //
// Black promotion not added yet //
// If a pawn can't move up one as a result of putting the king in check, it also shouldn't be allowed to move up two (think I've fixed it, but not tested yet) //

class Piece {
    constructor(type, colour) {
        this.type = type;
        this.colour = colour;
        this.x = 0;
        this.y = 0;
        this.previous_x;
        this.previous_y;
        this.proposed_moves;
        this.history = [];

        this.assign_strategy();
    }

    assign_strategy() {
        switch(this.type) {
            case PIECE_TYPES.ROOK:
                this.strategy = ROOK_STRATEGY;
                this.castling_rights = true;
                break;
            case PIECE_TYPES.KNIGHT:
                this.strategy = KNIGHT_STRATEGY;
                break;
            case PIECE_TYPES.BISHOP:
                this.strategy = BISHOP_STRATEGY;
                break;
            case PIECE_TYPES.QUEEN:
                this.strategy = QUEEN_STRATEGY;
                break;
            case PIECE_TYPES.KING:
                this.strategy = KING_STRATEGY;
                this.castling_rights = true;
                this.checked = false;
                break;
            case PIECE_TYPES.PAWN:
                this.strategy = PAWN_STRATEGY;
                break;
        }
    }

    getColour() {
        switch(this.type) {
            case PIECE_TYPES.ROOK:
                return 28;
            case PIECE_TYPES.KNIGHT:
                return 62;
            case PIECE_TYPES.BISHOP:
                return 47;
            case PIECE_TYPES.QUEEN:
                return 15;
            case PIECE_TYPES.KING:
                return 60;
            case PIECE_TYPES.PAWN:
                return 13;
        }
    }
}

const getAllMoves = (colour, board) => {
    let pieces = board.map(rank => rank.filter(p => p.colour === colour)).filter(result => result.length > 0);
    let all_potential_moves = [];
    pieces.forEach(rank => {
        rank.forEach(piece => {
            let moves = piece.strategy([piece.x, piece.y], board, piece, true);
            moves.forEach(move => all_potential_moves.push(move));
        })
    });
    return all_potential_moves;
}

const validateMoves = (moves, piece, board) => {
    let validatedMoves = [];
    let block_queenside_castling = false;
    let block_kingside_castling = false;

    // For each proposed move - simulate the board as if that move had been made //
    // If the king is in check - this move cannot be made //
    moves.forEach(move => {
        let board_copy = _.cloneDeep(board);

        // Pretend to make the move //
        let piece_clone = _.cloneDeep(piece);

        if(typeof(move[2]) === "string") {
            if(move[2].startsWith("castle")) {
                if(move[2] === "castle queenside") {
                    let rook_clone = _.cloneDeep(board_copy[7][0]);
                    board_copy[7][0] = "";
                    board_copy[7][4] = "";
                    piece_clone.x = 2;
                    piece_clone.y = 7;
                    rook_clone.x = 3;
                    rook_clone.y = 7;
                    board_copy[7][2] = piece_clone;
                    board_copy[7][3] = rook_clone;
                } else if(move[2] === "castle kingside") {
                    let rook_clone = _.cloneDeep(board_copy[7][7]);
                    board_copy[7][7] = "";
                    board_copy[7][4] = "";
                    piece_clone.x = 6;
                    piece_clone.y = 7;
                    rook_clone.x = 5;
                    rook_clone.y = 7;
                    board_copy[7][6] = piece_clone;
                    board_copy[7][5] = rook_clone;
                }
            }
        } else {
            board_copy[piece_clone.y][piece_clone.x] = "";
            piece_clone.x = move[0];
            piece_clone.y = move[1];
            board_copy[move[1]][move[0]] = piece_clone;
        }

        // Get all the moves that the opposite side could make, should this move be made //
        let all_potential_moves = getAllMoves((piece.colour === COLOUR.WHITE ? COLOUR.BLACK : COLOUR.WHITE), board_copy);

        // Does our King appear in these moves? //
        let king;
        if(piece.type !== PIECE_TYPES.KING) {
            king = board.map(rank => rank.filter(p => p.colour === (piece.colour === COLOUR.WHITE ? COLOUR.WHITE : COLOUR.BLACK) && p.type === PIECE_TYPES.KING)).filter(result => result.length > 0)[0][0]
        } else {
            king = piece_clone;
        }
        let king_check = all_potential_moves.filter(potential_move => potential_move[0] === king.x && potential_move[1] === king.y);
        
        if(king_check.length > 0) {
            // King would be in check - move should not be allowed //
            // Remove any castles //
            block_queenside_castling = true;
            block_kingside_castling = true;
        } else {
            if(move[2] === "queenside castling check") {
                if(!block_queenside_castling) {
                    if(all_potential_moves.filter(potential_move => potential_move[0] === move[0] && potential_move[1] === move[1]).length > 0) {
                        // We'd be passing through enemy territory - castling not allowed! //
                        // Block ALL future castling checks //
                        block_queenside_castling = true;
                    } else {
                        validatedMoves.push(move);
                    }
                }
            } else if(move[2] === "kingside castling check") {
                if(!block_kingside_castling) {
                    if(all_potential_moves.filter(potential_move => potential_move[0] === move[0] && potential_move[1] === move[1]).length > 0) {
                        // We'd be passing through enemy territory - castling not allowed! //
                        // Block ALL future castling checks //
                        block_kingside_castling = true;
                    } else {
                        validatedMoves.push(move);
                    }
                }
            } else {
                validatedMoves.push(move);
            }
        }
    });

    // Castling //
    let filtered_queenside_checks = validatedMoves.filter(move => move[2] === "queenside castling check");
    let filtered_kingside_checks = validatedMoves.filter(move => move[2] === "kingside castling check");
    if(filtered_queenside_checks.length === 4) {
        // We're good - remove the checks and keep the castle //
        validatedMoves = validatedMoves.filter(move => move[2] !== "queenside castling check")
    } else if (filtered_queenside_checks.length > 0 || block_queenside_castling) {
        // Remove them all, including the castling move //
        validatedMoves = validatedMoves.filter(move => move[2] !== "queenside castling check" && move[2] !== "castle queenside")
    }

    if(filtered_kingside_checks.length === 3) {
        // We're good - remove the checks and keep the castle //
        validatedMoves = validatedMoves.filter(move => move[2] !== "kingside castling check")
    } else if (filtered_kingside_checks.length > 0 || block_kingside_castling) {
        // Remove them all, including the castling move //
        validatedMoves = validatedMoves.filter(move => move[2] !== "kingside castling check" && move[2] !== "castle kingside")
    }

    return validatedMoves;
}

module.exports.checkForCheckmate = (colour, board) => {
    // TODO //
}

// Strategies //
const PAWN_STRATEGY = (position, board, piece, skip_scan = false) => {
    // Receives the current position, and the board //
    let x = position[0];
    let y = position[1];
    let moves = [];

    // First create a set of possible places to move to //
    if(piece.colour === COLOUR.WHITE) {
        // Can we move up one //
        if(y-1 >= 0) {
            if(!board[y-1][x]) {
                moves.push([x, y-1]);
                // If it's our first move we can move up two //
                if(y === 6) if(!board[y-2][x]) moves.push([x, y-2, "double"]);
            }
        }

        if(y-1 >= 0 && x-1 >= 0) {
            // Can we move north-west to capture? //
            if(board[y-1][x-1]) if(board[y-1][x-1].colour === COLOUR.BLACK) moves.push([x-1, y-1, true]);
        }

        if(y-1 >= 0 && x+1 <= 7) {
            // Can we move north-east to capture? //
            if(board[y-1][x+1]) if(board[y-1][x+1].colour === COLOUR.BLACK) moves.push([x+1, y-1, true]);
        }

        // En passant //
        if(piece.eligible_for_en_passant) {
            if(x-1 >= 0) if(board[y][x-1]) if(board[y][x-1].colour === COLOUR.BLACK && board[y][x-1].type === PIECE_TYPES.PAWN) {
                // We can capture en passant //
                moves.push([x-1, y-1, "en passant left"]);
            }

            if(x+1 <= 7) if(board[y][x+1]) if(board[y][x+1].colour === COLOUR.BLACK && board[y][x+1].type === PIECE_TYPES.PAWN) {
                // We can capture en passant //
                moves.push([x+1, y-1, "en passant right"]);
            }
        }    
    } else {
        // Can we move down one //
        if(y+1 <= 7) {
            if(!board[y+1][x]) {
                moves.push([x, y+1]); 
                // If it's our first move we can move down two //
                if(y === 1) if(!board[y+2][x]) moves.push([x, y+2, "double"]);
            }
        }

        if(y+1 <= 7 && x-1 >= 0) {
            // Can we move south-west to capture? //
            if(board[y+1][x-1]) if(board[y+1][x-1].colour === COLOUR.WHITE) moves.push([x-1, y+1, true]);
        }

        if(y+1 <= 7 && x+1 <= 7) {
            // Can we move south-east to capture? //
            if(board[y+1][x+1]) if(board[y+1][x+1].colour === COLOUR.WHITE) moves.push([x+1, y+1, true]);
        }
    }

    // Now validate these moves or skip the validation (in case this function is called by another validation method - avoid recursion) //
    if (!skip_scan) {
        moves = validateMoves(moves, piece, board);
        if(y === 6 && moves.length === 1) if(moves[0][1] === y-2) moves = [];
        if(piece.previous_x !== x || piece.previous_y !== y) {
            piece.history.push([x, y]);
        }
        piece.previous_x = x;
        piece.previous_y = y;
    }

    piece.proposed_moves = moves;
    return moves;
}

const ROOK_STRATEGY = (position, board, piece, skip_scan = false) => {
    // Receives the current position, and the board //
    let x = position[0];
    let y = position[1];
    let moves = [];

    if(y-1 >= 0) {
        // Go from current position up.... check for moves //
        let cont = true;
        for (let y_check = y-1; y_check >= 0 && cont; y_check--) {
            if(!board[y_check][x]) moves.push([x, y_check]);
            else {
                if(board[y_check][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) { moves.push([x, y_check]); cont = false; }
                else cont = false;
            }
        }
    }

    if(y+1 <= 7) {
        // Go from current position down.... check for moves //
        let cont = true;
        for (let y_check = y+1; y_check <= 7 && cont; y_check++) {
            if(!board[y_check][x]) moves.push([x, y_check]);
            else {
                if(board[y_check][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) { moves.push([x, y_check]); cont = false; }
                else cont = false;
            }
        }
    }

    if(x+1 <= 7) {
        // Go from current position right.... check for moves //
        let cont = true;
        for (let x_check = x+1; x_check <= 7 && cont; x_check++) {
            if(!board[y][x_check]) moves.push([x_check, y]);
            else {
                if(board[y][x_check].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) { moves.push([x_check, y]); cont = false; }
                else cont = false;
            }
        }
    }

    if(x-1 >= 0) {
        // Go from current position left.... check for moves //
        let cont = true;
        for (let x_check = x-1; x_check >= 0 && cont; x_check--) {
            if(!board[y][x_check]) moves.push([x_check, y]);
            else {
                if(board[y][x_check].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) { moves.push([x_check, y]); cont = false; }
                else cont = false;
            }
        }
    }

    if(!skip_scan) {
        moves = validateMoves(moves, piece, board);
        piece.history.push([x, y]);
    }

    piece.proposed_moves = moves;
    return moves;
}

const KNIGHT_STRATEGY = (position, board, piece, skip_scan = false) => {
    // Receives the current position, and the board //
    let x = position[0];
    let y = position[1];
    let moves = [];

    // Knight can make a max of eight moves.... //
    // Starting top-left and going clockwise //
    if(y-2 >= 0 && x-1 >= 0) if(!board[y-2][x-1]) moves.push([x-1, y-2]); else if(board[y-2][x-1]) { if(board[y-2][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-1, y-2]); }
    if(y-2 >= 0 && x+1 <= 7) if(!board[y-2][x+1]) moves.push([x+1, y-2]); else if(board[y-2][x+1]) { if(board[y-2][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+1, y-2]); }
    if(y-1 >= 0 && x+2 <= 7) if(!board[y-1][x+2]) moves.push([x+2, y-1]); else if(board[y-1][x+2]) { if(board[y-1][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+2, y-1]); }
    if(y+1 <= 7 && x+2 <= 7) if(!board[y+1][x+2]) moves.push([x+2, y+1]); else if(board[y+1][x+2]) { if(board[y+1][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+2, y+1]); }
    if(y+2 <= 7 && x+1 <= 7) if(!board[y+2][x+1]) moves.push([x+1, y+2]); else if(board[y+2][x+1]) { if(board[y+2][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+1, y+2]); }
    if(y+2 <= 7 && x-1 >= 0) if(!board[y+2][x-1]) moves.push([x-1, y+2]); else if(board[y+2][x-1]) { if(board[y+2][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-1, y+2]); }
    if(y+1 <= 7 && x-2 >= 0) if(!board[y+1][x-2]) moves.push([x-2, y+1]); else if(board[y+1][x-2]) { if(board[y+1][x-2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-2, y+1]); }
    if(y-1 >= 0 && x-2 >= 0) if(!board[y-1][x-2]) moves.push([x-2, y-1]); else if(board[y-1][x-2]) { if(board[y-1][x-2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-2, y-1]); }
    
    if(!skip_scan) moves = validateMoves(moves, piece, board);

    piece.proposed_moves = moves;
    return moves;
}

const BISHOP_STRATEGY = (position, board, piece, skip_scan = false) => {
    // Receives the current position, and the board //
    let x = position[0];
    let y = position[1];
    let moves = [];

    // Bishop moves diagonally, check all diagonals //
    let x_check = x;
    let y_check = y;
    let cont = true;
    while(x_check >= 0 && y_check >= 0 && cont) {
        if(x_check - 1 >= 0 && y_check - 1 >= 0) {
            if(!board[y_check-1][x_check-1]) {
                x_check -= 1;
                y_check -= 1;
                moves.push([x_check, y_check])
            } else {
                if(board[y_check-1][x_check-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    moves.push([x_check-1, y_check-1])
                    cont = false;
                } else cont = false;
            }
        } else cont = false;
    }

    x_check = x;
    y_check = y;
    cont = true;
    while(x_check <= 7 && y_check >= 0 && cont) {
        if(x_check + 1 <= 7 && y_check - 1 >= 0) {
            if(!board[y_check-1][x_check+1]) {
                x_check += 1;
                y_check -= 1;
                moves.push([x_check, y_check])
            } else {
                if(board[y_check-1][x_check+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    moves.push([x_check+1, y_check-1])
                    cont = false;
                } else cont = false;
            }
        } else cont = false;
    }

    x_check = x;
    y_check = y;
    cont = true;
    while(x_check >= 0 && y_check <= 7 && cont) {
        if(x_check - 1 >= 0 && y_check + 1 <= 7) {
            if(!board[y_check+1][x_check-1]) {
                x_check -= 1;
                y_check += 1;
                moves.push([x_check, y_check])
            } else {
                if(board[y_check+1][x_check-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    moves.push([x_check-1, y_check+1])
                    cont = false;
                } else cont = false;
            }
        } else cont = false;
    }

    x_check = x;
    y_check = y;
    cont = true;
    while(x_check <= 7 && y_check <= 7 && cont) {
        if(x_check + 1 <= 7 && y_check + 1 <= 7) {
            if(!board[y_check+1][x_check+1]) {
                x_check += 1;
                y_check += 1;
                moves.push([x_check, y_check])
            } else {
                if(board[y_check+1][x_check+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    moves.push([x_check+1, y_check+1])
                    cont = false;
                } else cont = false;
            }
        } else cont = false;
    }

    if(!skip_scan) {
        moves = validateMoves(moves, piece, board);
        piece.history.push([x, y]);
    }

    piece.proposed_moves = moves;
    return moves;
}

const QUEEN_STRATEGY = (position, board, piece, skip_scan = false) => {
    // Receives the current position, and the board //
    let moves = [];

    // Queen = Rook + Bishop //
    let rook_moves = ROOK_STRATEGY(position, board, piece, skip_scan);
    let bishop_moves = BISHOP_STRATEGY(position, board, piece, skip_scan);
    
    rook_moves.forEach(element => {
        moves.push(element);
    });

    bishop_moves.forEach(element => {
        moves.push(element);
    })

    if(!skip_scan) {
        moves = validateMoves(moves, piece, board);
        piece.history.push([position[0], position[1]]);
    }

    piece.proposed_moves = moves;
    return moves;
}

const KING_STRATEGY = (position, board, piece, skip_scan = false) => {
    // The hardest one! //
    // Will need to create a preliminary set of moves, then test each piece on black's side to see if it would put the king in check (removing the move) //
    let x = position[0];
    let y = position[1];
    let moves = [];

    // King can only move one space in any direction //
    if(x-1 >= 0) if(!board[y][x-1]) { moves.push([x-1, y]) } else if(board[y][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-1, y]);
    if(x-1 >= 0 && y-1 >= 0) if(!board[y-1][x-1]) { moves.push([x-1, y-1]) } else if(board[y-1][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-1, y-1]);
    if(y-1 >= 0) if(!board[y-1][x]) { moves.push([x, y-1]) } else if(board[y-1][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x, y-1]);
    if(x+1 <= 7 && y-1 >= 0) if(!board[y-1][x+1]) { moves.push([x+1, y-1]) } else if(board[y-1][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+1, y-1]);
    if(x+1 <= 7) if(!board[y][x+1]) { moves.push([x+1, y]) } else if(board[y][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+1, y]);
    if(x+1 <= 7 && y+1 <= 7) if(!board[y+1][x+1]) { moves.push([x+1, y+1]) } else if(board[y+1][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x+1, y+1]);
    if(y+1 <= 7) if(!board[y+1][x]) { moves.push([x, y+1]) } else if(board[y+1][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x, y+1]);
    if(y+1 <= 7 && x-1 >= 0) if(!board[y+1][x-1]) { moves.push([x-1, y+1]) } else if(board[y+1][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) moves.push([x-1, y+1]);

    if(piece.colour === COLOUR.WHITE) {
        // Castling //
        // Both the rook and the king must have castling rights //
        
        // Queenside //
        if(board[7][0]) if(board[7][0].type === PIECE_TYPES.ROOK && board[7][0].castling_rights) {
            if(!board[7][1] && !board[7][2] && !board[7][3]) {
                moves.push([0, 7, "queenside castling check"]);
                moves.push([1, 7, "queenside castling check"]);
                moves.push([2, 7, "queenside castling check"]);
                moves.push([3, 7, "queenside castling check"]);
                moves.push([2, 7, "castle queenside"]);
            }
        }

        // Kingside //
        if(board[7][7]) if(board[7][7].type === PIECE_TYPES.ROOK && board[7][7].castling_rights) {
            if(!board[7][5] && !board[7][6]) {
                moves.push([5, 7, "kingside castling check"]);
                moves.push([6, 7, "kingside castling check"]);
                moves.push([7, 7, "kingside castling check"]);
                moves.push([6, 7, "castle kingside"]);
            }
        }
    }
    
    if(!skip_scan) {
        moves = validateMoves(moves, piece, board);
        piece.history.push([x, y]);
    }
    
    const remove = (move) => {
        moves = moves.filter(m => m.toString() !== move.toString());
    }

    if(piece.colour === COLOUR.WHITE) {
        // The way the pawn captures is weird and so requires some extra logic here //

        // The logic is essentially "if the king moved ahead one, would it be susceptible to a check from a pawn diagonally?" //
        // Move the king in all 8 directions, and perform a check looking to the diagonal left and diagonal right //
        // West //
        if(x-1 >= 0) {
            if(x-2 >= 0 && y-1 >= 0) {
                if(board[y-1][x-2]) if(board[y-1][x-2].type === PIECE_TYPES.PAWN && board[y-1][x-2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x-1, y]);
                }
            }

            if(x+2 <= 7 && y-1 >= 0) {
                if(board[y-1][x+2]) if(board[y-1][x+2].type === PIECE_TYPES.PAWN && board[y-1][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x-1, y]);
                }
            }
        }

        // North-West //
        if(x-1 >= 0 && y-1 >= 0) {
            if(x-2 >= 0 && y-2 >= 0) {
                if(board[y-2][x-2]) if(board[y-2][x-2].type === PIECE_TYPES.PAWN && board[y-2][x-2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x-1, y-1]);
                }
            }

            if(y-2 >= 0) {
                if(board[y-2][x]) if(board[y-2][x].type === PIECE_TYPES.PAWN && board[y-2][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x-1, y-1]);
                }
            }
        }

        // North //
        if(y-1 >= 0) {
            if(x-1 >= 0 && y-2 >= 0) {
                if(board[y-2][x-1]) if(board[y-2][x-1].type === PIECE_TYPES.PAWN && board[y-2][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x, y-1]);
                }
            }

            if(x+1 >= 0 && y-2 >= 0) {
                if(board[y-2][x+1]) if(board[y-2][x+1].type === PIECE_TYPES.PAWN && board[y-2][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x, y-1]);
                }
            }
        }

        // North-East //
        if(x+1 <= 7 && y-1 >= 0) {
            if(y-2 >= 0) {
                if(board[y-2][x]) if(board[y-2][x].type === PIECE_TYPES.PAWN && board[y-2][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x+1, y-1]);
                }
            }

            if(x+2 >= 0 && y-2 >= 0) {
                if(board[y-2][x+2]) if(board[y-2][x+2].type === PIECE_TYPES.PAWN && board[y-2][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x+1, y-1]);
                }
            }
        }

        // East //
        if(x+1 <= 7) {
            if(y-1 >= 0) {
                if(board[y-1][x]) if(board[y-1][x].type === PIECE_TYPES.PAWN && board[y-1][x].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x+1, y]);
                }
            }

            if(x+2 >= 0 && y-1 >= 0) {
                if(board[y-1][x+2]) if(board[y-1][x+2].type === PIECE_TYPES.PAWN && board[y-1][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x+1, y]);
                }
            }
        }

        // South-East //
        if(x+1 <= 7 && y+1 <= 7) {
            if(x+2 <= 7) {
                if(board[y][x+2]) if(board[y][x+2].type === PIECE_TYPES.PAWN && board[y][x+2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x+1, y+1]);
                }
            }
        }

        // South //
        if(y+1 <= 7) {
            if(x-1 >= 0 && y-1 >= 0) {
                if(board[y][x-1]) if(board[y][x-1].type === PIECE_TYPES.PAWN && board[y][x-1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x, y+1]);
                }
            }

            if(x+1 <= 7 && y-1 >= 0) {
                if(board[y][x+1]) if(board[y][x+1].type === PIECE_TYPES.PAWN && board[y][x+1].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x, y+1]);
                }
            }
        }

        // South-West //
        if(x-1 >= 0 && y+1 <= 7) {
            if(x-2 >= 0) {
                if(board[y][x-2]) if(board[y][x-2].type === PIECE_TYPES.PAWN && board[y][x-2].colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK)) {
                    remove([x-1, y+1]);
                }
            }
        }
    }

    piece.proposed_moves = moves;
    return moves;
}

module.exports.Piece = Piece;