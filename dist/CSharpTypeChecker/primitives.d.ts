import { Coroutine, Unit } from "ts-bccc";
import { ParserState, ParserError, Parser, ParserRes, DeclAST, DeclAndInitAST, ConstructorDeclarationAST, FunctionDeclarationAST, ConstructorAST, MethodAST, FieldAST, ModifierAST } from "./grammar";
import { SourceRange } from "../source_range";
import { BinOpKind, UnaryOpKind } from "./lexer";
import * as Immutable from 'immutable';
export declare let parser_or: <a>(p: Coroutine<ParserState, ParserError, a>, q: Coroutine<ParserState, ParserError, a>) => Coroutine<ParserState, ParserError, a>;
export declare const mk_generic_type_inst: (r: SourceRange, f: ParserRes, args: ParserRes[]) => ParserRes;
export declare const mk_get_array_value_at: (r: SourceRange, a: ParserRes, actual: ParserRes) => ParserRes;
export declare const mk_ternary_if: (r: SourceRange, condition: ParserRes, then_else: ParserRes) => ParserRes;
export declare const mk_ternary_then_else: (r: SourceRange, _then: ParserRes, _else: ParserRes) => ParserRes;
export declare const mk_array_decl: (r: SourceRange, t: ParserRes) => ParserRes;
export declare const mk_tuple_type_decl: (r: SourceRange, args: ParserRes[]) => ParserRes;
export declare const mk_record_type_decl: (r: SourceRange, args: DeclAST[]) => ParserRes;
export declare const mk_string: (v: string, sr: SourceRange) => ParserRes;
export declare const mk_bracket: (e: ParserRes, r: SourceRange) => ParserRes;
export declare const mk_unit: (sr: SourceRange) => ParserRes;
export declare const mk_bool: (v: boolean, sr: SourceRange) => ParserRes;
export declare const mk_int: (v: number, sr: SourceRange) => ParserRes;
export declare const mk_float: (v: number, sr: SourceRange) => ParserRes;
export declare const mk_double: (v: number, sr: SourceRange) => ParserRes;
export declare const mk_identifier: (v: string, sr: SourceRange) => ParserRes;
export declare const mk_noop: () => ParserRes;
export declare const mk_return: (e: ParserRes, range: SourceRange) => ParserRes;
export declare const mk_args: (sr: SourceRange, ds: DeclAST[]) => ParserRes;
export declare const mk_decl_and_init: (l: ParserRes, r: ParserRes, v: ParserRes) => DeclAndInitAST;
export declare const mk_decl: (l: ParserRes, r: ParserRes) => DeclAST;
export declare const mk_assign: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_for: (range: SourceRange, i: ParserRes, c: ParserRes, s: ParserRes, b: ParserRes) => ParserRes;
export declare const mk_while: (range: SourceRange, c: ParserRes, b: ParserRes) => ParserRes;
export declare const mk_if_then: (range: SourceRange, c: ParserRes, t: ParserRes) => ParserRes;
export declare const mk_if_then_else: (range: SourceRange, c: ParserRes, t: ParserRes, e: ParserRes) => ParserRes;
export declare const mk_field_ref: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_semicolon: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_bin_op: (k: BinOpKind) => (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_pair: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_arrow: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_as: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_plus: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_minus: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_times: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_div: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_mod: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_lt: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_gt: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_leq: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_geq: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_eq: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_neq: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_and: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_or: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_xor: (l: ParserRes, r: ParserRes) => ParserRes;
export declare const mk_unary_op: (k: "not") => (e: ParserRes) => ParserRes;
export declare const mk_not: (e: ParserRes) => ParserRes;
export declare const mk_call: (f_name: ParserRes, actuals: ParserRes[], range: SourceRange) => ParserRes;
export declare const mk_constructor_call: (new_range: SourceRange, C_name: string, actuals: ParserRes[]) => ParserRes;
export declare const mk_array_cons_call: (new_range: SourceRange, _type: ParserRes, actual: ParserRes) => ParserRes;
export declare const mk_array_cons_call_and_init: (new_range: SourceRange, _type: ParserRes, actuals: ParserRes[]) => ParserRes;
export declare const mk_constructor_declaration: (range: SourceRange, function_name: string, arg_decls: Immutable.List<DeclAST>, params_base_call: {
    kind: "right";
    value: Unit;
} | {
    kind: "left";
    value: ParserRes[];
}, body: ParserRes) => ConstructorDeclarationAST;
export declare const mk_function_declaration: (range: SourceRange, return_type: ParserRes, function_name: string, arg_decls: Immutable.List<DeclAST>, body: ParserRes) => FunctionDeclarationAST;
export declare const mk_class_declaration: (C_name: string, generic_parameters: {
    name: ParserRes;
    variant: "co" | "contra" | "inv";
}[], extends_or_implements: string[], fields: Immutable.List<FieldAST>, methods: Immutable.List<MethodAST>, constructors: Immutable.List<ConstructorAST>, modifiers: Immutable.List<ModifierAST>, range: SourceRange) => ParserRes;
export declare const mk_private: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_public: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_protected: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_static: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_override: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_abstract: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_interface: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_virtual: (sr: SourceRange) => {
    range: SourceRange;
    ast: ModifierAST;
};
export declare const mk_dbg: (sr: SourceRange) => ParserRes;
export declare const mk_tc_dbg: (sr: SourceRange) => ParserRes;
export declare const mk_empty_surface: (sr: SourceRange, w: ParserRes, h: ParserRes, col: ParserRes) => ParserRes;
export declare const mk_circle: (sr: SourceRange, cx: ParserRes, cy: ParserRes, r: ParserRes, col: ParserRes) => ParserRes;
export declare const mk_square: (sr: SourceRange, cx: ParserRes, cy: ParserRes, s: ParserRes, col: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_ellipse: (sr: SourceRange, cx: ParserRes, cy: ParserRes, w: ParserRes, h: ParserRes, col: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_rectangle: (sr: SourceRange, cx: ParserRes, cy: ParserRes, w: ParserRes, h: ParserRes, col: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_sprite: (sr: SourceRange, sprite: ParserRes, cx: ParserRes, cy: ParserRes, w: ParserRes, h: ParserRes, rot: ParserRes) => ParserRes;
export declare const mk_line: (sr: SourceRange, x1: ParserRes, y1: ParserRes, x2: ParserRes, y2: ParserRes, width: ParserRes, color: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_polygon: (sr: SourceRange, points: ParserRes, color: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_text: (sr: SourceRange, t: ParserRes, x: ParserRes, y: ParserRes, size: ParserRes, color: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_other_surface: (sr: SourceRange, s: ParserRes, dx: ParserRes, dy: ParserRes, sx: ParserRes, sy: ParserRes, rotation: ParserRes) => ParserRes;
export declare const mk_empty_surface_prs: () => Parser;
export declare const mk_circle_prs: () => Parser;
export declare const mk_square_prs: () => Parser;
export declare const mk_ellipse_prs: () => Parser;
export declare const mk_rectangle_prs: () => Parser;
export declare const mk_line_prs: () => Parser;
export declare const mk_polygon_prs: () => Parser;
export declare const mk_text_prs: () => Parser;
export declare const mk_sprite_prs: () => Parser;
export declare const mk_other_surface_prs: () => Parser;
export declare const term: (try_par: boolean) => Parser;
export declare const unary_expr: () => Parser;
export declare const newline_sign: Coroutine<ParserState, ParserError, Unit>;
export declare const whitespace_sign: Coroutine<ParserState, ParserError, Unit>;
export declare const merge_errors: (e1: ParserError, e2: ParserError) => ParserError;
export declare const whitespace: () => Coroutine<ParserState, ParserError, {}>;
export declare const ignore_whitespace: <a>(p: Coroutine<ParserState, ParserError, a>) => Coroutine<ParserState, ParserError, a>;
export declare const symbol: (token_kind: string, token_name: string) => Coroutine<ParserState, ParserError, SourceRange>;
export declare const binop_sign: (_: BinOpKind) => Coroutine<ParserState, ParserError, SourceRange>;
export declare const unaryop_sign: (_: UnaryOpKind) => Coroutine<ParserState, ParserError, Unit>;
export declare const string: Parser;
export declare const bool: Parser;
export declare const int: Parser;
export declare const float: Parser;
export declare const double: Parser;
export declare const negative_number: Parser;
export declare const identifier_token: Coroutine<ParserState, ParserError, {
    id: string;
    range: SourceRange;
}>;
export declare const identifier: Parser;
export declare const return_sign: Coroutine<ParserState, ParserError, SourceRange>;
export declare const for_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const while_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const if_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const question_mark_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const colon_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const else_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const equal_sign: Coroutine<ParserState, ParserError, SourceRange>;
export declare const semicolon_sign: Coroutine<ParserState, ParserError, SourceRange>;
export declare const comma_sign: Coroutine<ParserState, ParserError, SourceRange>;
export declare const class_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const new_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const base: Coroutine<ParserState, ParserError, SourceRange>;
export declare const surface_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const empty_surface_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const sprite_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const circle_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const square_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const rectangle_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const ellipse_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const line_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const polygon_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const text_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const other_surface_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const filesystem_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const file_keyword: Coroutine<ParserState, ParserError, SourceRange>;
export declare const left_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const right_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const left_square_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const right_square_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const left_curly_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const right_curly_bracket: Coroutine<ParserState, ParserError, SourceRange>;
export declare const dot_sign: Coroutine<ParserState, ParserError, SourceRange>;
export declare const private_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const public_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const protected_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const static_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const override_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const virtual_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const abstract_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const interface_modifier: Coroutine<ParserState, ParserError, SourceRange>;
export declare const as_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const plus_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const minus_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const times_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const div_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const mod_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const lt_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const gt_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const leq_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const geq_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const eq_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const neq_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const and_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const or_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const xor_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const arrow_op: Coroutine<ParserState, ParserError, SourceRange>;
export declare const not_op: Coroutine<ParserState, ParserError, Unit>;
export declare const eof: Coroutine<ParserState, ParserError, SourceRange>;
