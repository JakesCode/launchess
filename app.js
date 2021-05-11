const midi = require('midi');
const { PIECE_TYPES, COLOUR, BRIGHTNESS } = require('./classes/enums');
const Piece = require('./classes/Piece').Piece;
const checkForCheckmate = require("./classes/Piece").checkForCheckmate;

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
        redraw();
    }
}

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const moveToNotation = (from, to) => {
    // Convert the X coordinate to a file //
    let from_file = files[from[0]];
    let to_file = files[to[0]];

    // Change the rank from 0-based to 1-based and then 'flip' it for white //
    let from_one_based = (8 - (from[1] + 1)) + 1;
    let to_one_based = (8 - (to[1] + 1)) + 1;

    return from_file + from_one_based + to_file + to_one_based;
};

let whose_turn = COLOUR.WHITE;

let selected_piece;
input.on('message', (deltaTime, message) => {
    if(message[1] === 120) {
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
                        }

                        // Revoke castling rights //
                        selected_piece.castling_rights = false;
                        board[selected_piece.y][selected_piece.x].castling_rights = false;
                    }
                } else {
                    // Anything other than a castle //
                    if(selected_piece.type === PIECE_TYPES.KING) {
                        console.log(selected_piece.castling_rights);
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
                    redraw();
                }

                console.log(algebraic_notation);
                // Check for a checkmate //
                checkForCheckmate((whose_turn === COLOUR.BLACK ? COLOUR.WHITE : COLOUR.BLACK), board);

                // Swap whose turn it is //
                if(whose_turn === COLOUR.BLACK) whose_turn = COLOUR.WHITE; else whose_turn = COLOUR.BLACK;
            }
            selected_piece = undefined;
            redraw();
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