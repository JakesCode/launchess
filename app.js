const midi = require('midi');
const { PIECE_TYPES, COLOUR } = require('./classes/enums');
const Piece = require('./classes/Piece').Piece;
const dotenv = require("dotenv");

dotenv.config(); // Load .env //

// Set up a new output.
const input = new midi.Input();
const output = new midi.Output();

let launchpadIn;
let launchpadOut;

for (let inputPort = 0; inputPort < input.getPortCount(); inputPort++) {
    if(input.getPortName(inputPort).toLowerCase().includes("launchpad")) launchpadIn = inputPort;
}

for (let outputPort = 0; outputPort < output.getPortCount(); outputPort++) {
    if(output.getPortName(outputPort).toLowerCase().includes("launchpad")) launchpadOut = outputPort;
}

input.openPort(launchpadIn);
output.openPort(launchpadOut);

// Turn off all LEDs //
output.sendMessage([176, 0, 0]);

let board = [
  [
    new Piece(PIECE_TYPES.ROOK, COLOUR.BLACK),
    new Piece(PIECE_TYPES.KNIGHT, COLOUR.BLACK),
    new Piece(PIECE_TYPES.BISHOP, COLOUR.BLACK),
    new Piece(PIECE_TYPES.QUEEN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.KING, COLOUR.BLACK),
    new Piece(PIECE_TYPES.BISHOP, COLOUR.BLACK),
    new Piece(PIECE_TYPES.KNIGHT, COLOUR.BLACK),
    new Piece(PIECE_TYPES.ROOK, COLOUR.BLACK),
  ],
  [
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
    new Piece(PIECE_TYPES.PAWN, COLOUR.BLACK),
  ],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.PAWN, COLOUR.WHITE),
  ],
  [
    new Piece(PIECE_TYPES.ROOK, COLOUR.WHITE),
    new Piece(PIECE_TYPES.KNIGHT, COLOUR.WHITE),
    new Piece(PIECE_TYPES.BISHOP, COLOUR.WHITE),
    new Piece(PIECE_TYPES.QUEEN, COLOUR.WHITE),
    new Piece(PIECE_TYPES.KING, COLOUR.WHITE),
    new Piece(PIECE_TYPES.BISHOP, COLOUR.WHITE),
    new Piece(PIECE_TYPES.KNIGHT, COLOUR.WHITE),
    new Piece(PIECE_TYPES.ROOK, COLOUR.WHITE),
  ],
];

for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
        board[y][x].x = x;
        board[y][x].y = y;
    }
}

const coordinatesToDecimal = (x, y) => 16*(y) + (x)
const decimalToCoordinates = (d) => {
    let x = (d % 16);
    let y = Math.floor(d/16);
    return [x, y];
}
const redraw = (colour) => {
    if(colour) colour_filter = colour; else colour_filter = undefined;
    // output.sendMessage([176, 0, 0]);
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const piece = board[y][x];
            if(typeof(piece) === "object") {
                if(colour) {
                    if(piece.colour === colour) output.sendMessage([144, coordinatesToDecimal(x, y), piece.getColour()]);
                } else output.sendMessage([144, coordinatesToDecimal(x, y), piece.getColour()]);
            }
        }
    }
}

var should_blink = false;
const blink = (positions, colour, blink_toggle = false) => {
    if(should_blink) {
        setTimeout(() => {
            positions.forEach(position => {
                if(blink_toggle) {
                    // Turn light off //
                    output.sendMessage([144, coordinatesToDecimal(position[0], position[1]), 12]);
                } else {
                    // Turn light on //
                    output.sendMessage([144, coordinatesToDecimal(position[0], position[1]), colour]);
                }
            });

            blink(positions, colour, !blink_toggle);
        }, 100);
    } else {
        // Turn all positions off //
        positions.forEach(position => {
            output.sendMessage([144, coordinatesToDecimal(position[0], position[1]), 12]);
        });
        if(!ask_promotion) {
            redraw();
        } else {
            show_promotion();
        }
    }
}

const sendMove = (move) => {
    console.log(move);
}

const show_promotion = () => {
    // Turn all lights off //
    output.sendMessage([176, 0, 0]);

    // Ask which piece the pawn would like to promote to //
    output.sendMessage([144, coordinatesToDecimal(2, 2), 28]);
    output.sendMessage([144, coordinatesToDecimal(5, 2), 62]);
    output.sendMessage([144, coordinatesToDecimal(2, 5), 47]);
    output.sendMessage([144, coordinatesToDecimal(5, 5), 15]);
}

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const moveToNotation = (from, to, promotion) => {
    let piece;
    if(promotion) {
        piece = board[to[1]][to[0]];
        from = [piece.previous_x, piece.previous_y];
    }
    // Convert the X coordinate to a file //
    let from_file = files[from[0]];
    let to_file = files[to[0]];

    // Change the rank from 0-based to 1-based and then 'flip' it for white //
    let from_one_based = (8 - (from[1] + 1)) + 1;
    let to_one_based = (8 - (to[1] + 1)) + 1;

    let promoted_to = "";
    if(promotion) {
        if(piece.type === PIECE_TYPES.QUEEN) promoted_to = "q";
        else if(piece.type === PIECE_TYPES.ROOK) promoted_to = "r";
        else if(piece.type === PIECE_TYPES.BISHOP) promoted_to = "b";
        else if(piece.type === PIECE_TYPES.KNIGHT) promoted_to = "n";
    }

    return from_file + from_one_based + to_file + to_one_based + promoted_to;
};
const notationToMove = (notation) => {
    // e.g. b8c6 //
    // We need to turn b8 into 1,0 and c6 into 2,2 //

    let from = notation.substring(0, 2).split("");
    let to = notation.substring(2, 4).split("");

    let from_file = files.indexOf(from[0]);
    let to_file = files.indexOf(to[0]);

    let from_zero_based = 8 - from[1];
    let to_zero_based = 8 - to[1];

    let converted_from = [eval(from_file), eval(from_zero_based)];
    let converted_to = [eval(to_file), eval(to_zero_based)];

    return [converted_from, converted_to];
}

let whose_turn = COLOUR.WHITE;
let ask_promotion = false;
let selected_piece;
input.on('message', (deltaTime, message) => {
    if(ask_promotion) {
        if(message[2] === 127)  {
            let coords_pressed = decimalToCoordinates(message[1]);
            let chosen_type;
            if(coords_pressed.toString() === [2, 2].toString()) {
                // Promote to rook //
                console.log("Promote to rook");
                chosen_type = PIECE_TYPES.ROOK;
            } else if (coords_pressed.toString() === [5, 2].toString()) {
                // Promote to knight //
                console.log("Promote to knight");
                chosen_type = PIECE_TYPES.KNIGHT;
            } else if (coords_pressed.toString() === [2, 5].toString()) {
                // Promote to bishop //
                console.log("Promote to bishop");
                chosen_type = PIECE_TYPES.BISHOP;
            } else if (coords_pressed.toString() === [5, 5].toString()) {
                // Promote to queen //
                console.log("Promote to queen");
                chosen_type = PIECE_TYPES.QUEEN;
            }

            if(chosen_type) {
                // Valid move was made - come out of promotion mode, promote the piece, redraw the board //
                ask_promotion = false;
                selected_piece.type = chosen_type;
                selected_piece.assign_strategy();
                board[selected_piece.y][selected_piece.x] = selected_piece;
                let algebraic_notation = moveToNotation([selected_piece.x, selected_piece.y], [selected_piece.x, selected_piece.y], chosen_type);
                sendMove(algebraic_notation);
                selected_piece = undefined;
                output.sendMessage([176, 0, 0]);
                redraw();
            }
        }
    }
    else if(message[1] === 120) {
        if(message[2] === 127) {output.sendMessage([176, 0, 0]); redraw(COLOUR.WHITE);}
        else redraw();
    } else if(message[1] === 8) {
        if(message[2] === 127) {output.sendMessage([176, 0, 0]); redraw(COLOUR.BLACK);}
        else redraw();
    }
    else if(message[2] === 127) {
        should_blink = false;

        // Get position pressed //
        let pos = decimalToCoordinates(message[1]);
        if(selected_piece) {
            let chosen_moves = selected_piece.proposed_moves.filter(move => move[0] === pos[0] && move[1] === pos[1]);
            if(chosen_moves.length > 0) {
                // A move was actually chosen //
                let chosen_move = chosen_moves[0];
                let algebraic_notation = moveToNotation([selected_piece.x, selected_piece.y], chosen_move);
                
                // Castling logic //
                if(typeof(chosen_move[2]) === "string") {
                    if(chosen_move[2].startsWith("castle")) {
                        if(chosen_move[2] === "castle queenside") {
                            let rook = board[7][0];
                            rook.x = 3;
                            rook.y = 7;
                            selected_piece.x = 2;
                            selected_piece.y = 7;
                            board[7][0] = "";
                            board[7][4] = "";
                            board[7][2] = selected_piece;
                            board[7][3] = rook;
                            output.sendMessage([144, coordinatesToDecimal(0, 7), 12]);
                        } else if(chosen_move[2] === "castle kingside") {
                            let rook = board[7][7];
                            rook.x = 5;
                            rook.y = 7;
                            selected_piece.x = 6;
                            selected_piece.y = 7;
                            board[7][7] = "";
                            board[7][4] = "";
                            board[7][6] = selected_piece;
                            board[7][5] = rook;
                            output.sendMessage([144, coordinatesToDecimal(7, 7), 12]);
                        }

                        // Revoke castling rights //
                        selected_piece.castling_rights = false;
                        board[selected_piece.y][selected_piece.x].castling_rights = false;
                    }
                } else {
                    // Anything other than a castle //
                    if(selected_piece.type === PIECE_TYPES.KING || selected_piece.type === PIECE_TYPES.ROOK) {
                        if(selected_piece.castling_rights) {
                            // Revoke castling rights //
                            selected_piece.castling_rights = false;
                            board[selected_piece.y][selected_piece.x].castling_rights = false;
                        }
                    }

                    board[selected_piece.y][selected_piece.x] = "";
                    selected_piece.x = chosen_move[0];
                    selected_piece.y = chosen_move[1];
                    board[chosen_move[1]][chosen_move[0]] = selected_piece;

                    if(selected_piece.type === PIECE_TYPES.PAWN) {
                        if(selected_piece.colour === COLOUR.WHITE && selected_piece.y === 0) {
                            // White promotes //
                            console.log("White pawn promotes");
                            ask_promotion = true;
                        } else if (selected_piece.colour === COLOUR.BLACK && selected_piece.y === 7) {
                            // Black promotes //
                            console.log("Black pawn promotes");
                            ask_promotion = true;
                        } else {
                            sendMove(algebraic_notation);
                        }
                    } else {
                        sendMove(algebraic_notation);
                    }
                }

                // Check for a checkmate //
                // checkForCheckmate((whose_turn === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK), board);

                // Swap whose turn it is //
                if(whose_turn === COLOUR.BLACK) whose_turn = COLOUR.WHITE; else whose_turn = COLOUR.BLACK;
            }
            
            if(!ask_promotion) {
                selected_piece = undefined;
                redraw();
            }
        } else {
            if(pos[0] >= 0 && pos[0] <= 8 && pos[1] >= 0 && pos[1] <= 8) {
                let x = pos[0];
                let y = pos[1];
                if(board[y][x] !== "") {
                    let piece = board[y][x];
                    if(piece.colour === whose_turn) {
                        if(piece === selected_piece) {
                            output.sendMessage([144, coordinatesToDecimal(selected_piece.x, selected_piece.y), selected_piece.getColour()]);
                            selected_piece = undefined;
                            redraw();
                        } else {
                            if(selected_piece) {
                                // Put old piece back //
                                output.sendMessage([144, coordinatesToDecimal(selected_piece.x, selected_piece.y), selected_piece.getColour()]);
                            }

                            selected_piece = piece;
                            let moves = selected_piece.strategy([x, y], board, selected_piece);
                            if(moves.length > 0) {
                                // Turn the current move's square 'off' //
                                output.sendMessage([144, coordinatesToDecimal(x, y), 12]);

                                should_blink = true;
                                blink(moves, selected_piece.getColour());
                            } else selected_piece = undefined;
                        }
                    }
                }
            }
        }
    }
});

redraw();

process.on("SIGINT", () => output.closePort())