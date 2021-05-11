const { PIECE_TYPES, COLOUR } = require("./enums");
const _ = require("lodash");

class Piece {
    constructor(type, colour) {
        this.type = type;
        this.colour = colour;
        this.x = 0;
        this.y = 0;
        this.proposed_moves;

        switch(this.type) {
            case PIECE_TYPES.ROOK:
                this.strategy = ROOK_STRATEGY;
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

// Strategies //
const PAWN_STRATEGY = (position, board, piece) => {
    // Receives the current position, and the board //
    let x = position[0];
    let y = position[1];
    let moves = [];

    // Check if first move - option to move two //
    if(piece.colour === COLOUR.WHITE) {
        if(y-1 >= 0) {
            if(!board[y-1][x]) {
                moves.push([x, y-1]);
                if(y === 6 && !board[y-2][x]) {
                    moves.push([x, y-2]);
                };
            }
        
            // Capturing logic //
            if(x-1 >= 0 && y-1 >= 0) if(board[y-1][x-1]) if(board[y-1][x-1].colour === COLOUR.BLACK) moves.push([x-1,y-1,true]);
            if(x+1 <= 7 && y-1 >= 0) if(board[y-1][x+1]) if(board[y-1][x+1].colour === COLOUR.BLACK) moves.push([x+1,y-1,true]);
        }
    } else {
        if(y+1 <= 7) {
            if(!board[y+1][x]) {
                moves.push([x, y+1]);
                if(y === 1 && !board[y+2][x]) {
                    moves.push([x, y+2]);
                };
            }
        
            // Capturing logic //
            if(x-1 >= 0 && y+1 <= 7) if(board[y+1][x-1]) if(board[y+1][x-1].colour === COLOUR.WHITE) moves.push([x-1,y+1,true]);
            if(x+1 <= 7 && y+1 <= 7) if(board[y+1][x+1]) if(board[y+1][x+1].colour === COLOUR.WHITE) moves.push([x+1,y+1,true]);
        }
    }

    piece.proposed_moves = moves;
    return moves;
}

const ROOK_STRATEGY = (position, board, piece) => {
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

    piece.proposed_moves = moves;
    return moves;
}

const KNIGHT_STRATEGY = (position, board, piece) => {
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
    
    piece.proposed_moves = moves;
    return moves;
}

const BISHOP_STRATEGY = (position, board, piece) => {
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

    piece.proposed_moves = moves;
    return moves;
}

const QUEEN_STRATEGY = (position, board, piece) => {
    // Receives the current position, and the board //
    let moves = [];

    // Queen = Rook + Bishop //
    let rook_moves = ROOK_STRATEGY(position, board, piece);
    let bishop_moves = BISHOP_STRATEGY(position, board, piece);
    
    rook_moves.forEach(element => {
        moves.push(element);
    });

    bishop_moves.forEach(element => {
        moves.push(element);
    })

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

    // However, the king cannot purposefuly put himself in check //
    if(!skip_scan) {
        let opposite_moves = [];
        let opposite_pieces = board.map(rank => rank.filter(p => p.colour === (piece.colour === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK))).filter(result => result.length > 0);
        opposite_pieces.forEach(opposite_piece_rank => {
            opposite_piece_rank.forEach(opposite_piece => {
                // Run the strategy for this piece, see what positions it could potentially move to //
                
                if(opposite_piece.type !== PIECE_TYPES.PAWN) {
                    let moves_for_this_piece = [];
                    moves_for_this_piece = opposite_piece.strategy([opposite_piece.x, opposite_piece.y], board, opposite_piece, true);
                    if(moves_for_this_piece.length > 0) {
                        moves_for_this_piece.forEach(move => {
                            opposite_moves.push(move);
                        });
                    }
                }
            }); 
        });

        const remove = (move) => {
            moves = moves.filter(m => m.toString() !== move.toString());
        }

        // TODO - For each possible move, run the same algorithm and see if taking that piece would put you into check - not allowed //

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

        // Now we have a set of moves that the opposite side could make //
        // Work out which moves we can make that don't appear in the opposite side's move set //
        // moves.forEach(move => {
        //     let filtered_moves = opposite_moves.filter(opposite_move => opposite_move.toString() === move.toString());
        //     if(filtered_moves.length > 0) {
        //         filtered_moves.forEach(filtered_move => {
        //             moves = moves.filter(m => m.toString() !== filtered_move.toString());
        //         });
        //     }
        // });
    }

    piece.proposed_moves = moves;
    return moves;
}

module.exports = Piece;