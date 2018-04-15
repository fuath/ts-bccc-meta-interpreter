import { Unit, Fun, Prod, Sum } from "ts-bccc";
import * as CCC from "ts-bccc";
import { SourceRange } from "../source_range";
import { Stmt, State, Err, Typing, Type, TypeInformation, Parameter, LambdaDefinition, FunDefinition, MethodDefinition, CallingContext, FieldDefinition, Modifier, ObjType } from "./types";
export declare let wrap_co_res: Fun<Prod<Typing, State>, Sum<Prod<CCC.Coroutine<State, Err, Typing>, State>, Prod<Typing, State>>>;
export declare let wrap_co: Fun<Prod<Typing, State>, Sum<Err, Sum<Prod<CCC.Coroutine<State, Err, Typing>, State>, Prod<Typing, State>>>>;
export declare let get_v: (r: SourceRange, v: string) => Stmt;
export declare let decl_forced_v: (r: SourceRange, v: string, t: Type, is_constant?: boolean | undefined) => Stmt;
export declare let decl_v: (r: SourceRange, v: string, t: Type, is_constant?: boolean | undefined) => Stmt;
export declare let decl_and_init_v: (r: SourceRange, v: string, t: Type, e: Stmt, is_constant?: boolean | undefined) => Stmt;
export declare let decl_const: (r: SourceRange, c: string, t: Type, e: Stmt) => Stmt;
export declare let set_v: (r: SourceRange, v: string, e: Stmt) => Stmt;
export declare let bool: (r: SourceRange, b: boolean) => Stmt;
export declare let str: (r: SourceRange, s: string) => Stmt;
export declare let int: (r: SourceRange, i: number) => Stmt;
export declare let float: (r: SourceRange, i: number) => Stmt;
export declare let double: (r: SourceRange, i: number) => Stmt;
export declare let tuple_value: (r: SourceRange, args: Stmt[]) => Stmt;
export declare let gt: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let lt: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let geq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let leq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let eq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let neq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let xor: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let mk_empty_surface: (r: SourceRange, w: Stmt, h: Stmt, col: Stmt) => Stmt;
export declare let mk_circle: (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt) => Stmt;
export declare let mk_square: (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_ellipse: (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_rectangle: (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_line: (r: SourceRange, x1: Stmt, y1: Stmt, x2: Stmt, y2: Stmt, w: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_polygon: (r: SourceRange, points: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_text: (r: SourceRange, t: Stmt, x: Stmt, y: Stmt, s: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_sprite: (r: SourceRange, sprite: Stmt, x: Stmt, y: Stmt, w: Stmt, h: Stmt, rot: Stmt) => Stmt;
export declare let mk_other_surface: (r: SourceRange, s: Stmt, dx: Stmt, dy: Stmt, sx: Stmt, sy: Stmt, rot: Stmt) => Stmt;
export declare let unary_op: (r: SourceRange, a: Stmt, op: string) => Stmt;
export declare let bin_op: (r: SourceRange, a: Stmt, b: Stmt, op: string) => Stmt;
export declare let plus: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let minus: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let div: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let times: (r: SourceRange, a: Stmt, b: Stmt, sr: SourceRange) => Stmt;
export declare let mod: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let minus_unary: (r: SourceRange, a: Stmt) => Stmt;
export declare let or: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let and: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let arrow: (r: SourceRange, parameters: Parameter[], closure: string[], body: Stmt) => Stmt;
export declare let not: (r: SourceRange, a: Stmt) => Stmt;
export declare let get_index: (r: SourceRange, a: Stmt, i: Stmt) => Stmt;
export declare let set_index: (r: SourceRange, a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let breakpoint: (r: SourceRange) => (_: Stmt) => Stmt;
export declare let typechecker_breakpoint: (range: SourceRange) => (_: Stmt) => Stmt;
export declare let highlight: Fun<Prod<SourceRange, State>, State>;
export declare let set_highlighting: (r: SourceRange) => Stmt;
export declare let done: Stmt;
export declare let lub: (t1: TypeInformation, t2: TypeInformation) => Sum<TypeInformation, Unit>;
export declare let if_then_else: (r: SourceRange, c: Stmt, t: Stmt, e: Stmt) => Stmt;
export declare let while_do: (r: SourceRange, c: Stmt, b: Stmt) => Stmt;
export declare let for_loop: (r: SourceRange, i: Stmt, c: Stmt, s: Stmt, b: Stmt) => Stmt;
export declare let semicolon: (r: SourceRange, p: Stmt, q: Stmt) => Stmt;
export declare let mk_param: (name: string, type: Type) => {
    name: string;
    type: Type;
};
export declare let mk_lambda: (r: SourceRange, def: LambdaDefinition, closure_parameters: string[], range: SourceRange) => Stmt;
export declare let def_fun: (r: SourceRange, def: FunDefinition, closure_parameters: string[]) => Stmt;
export declare let def_method: (r: SourceRange, C_name: string, _extends: Sum<ObjType, Unit>, _implements: ObjType[], def: MethodDefinition, abstract_methods: MethodDefinition[]) => Stmt;
export declare let call_lambda: (r: SourceRange, lambda: Stmt, arg_values: Stmt[]) => Stmt;
export declare let call_by_name: (r: SourceRange, f_n: string, args: Stmt[]) => Stmt;
export declare let ret: (r: SourceRange, p: Stmt) => Stmt;
export declare let new_array: (r: SourceRange, type: Type, len: Stmt) => Stmt;
export declare let new_array_and_init: (r: SourceRange, type: Type, args: Stmt[]) => Stmt;
export declare let get_arr_el: (r: SourceRange, a: Stmt, i: Stmt) => Stmt;
export declare let set_arr_el: (r: SourceRange, a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let def_class: (r: SourceRange, modifiers: Modifier[], C_kind: "abstract" | "interface" | "normal", C_name: string, extends_or_implements: string[], methods_from_context: ((_: CallingContext) => MethodDefinition)[], fields_from_context: ((_: CallingContext) => FieldDefinition)[], is_internal?: boolean) => Stmt;
export declare let field_get: (r: SourceRange, context: CallingContext, this_ref: Stmt, F_or_M_name: string, n?: number, called_by?: string) => Stmt;
export declare let field_set: (r: SourceRange, context: CallingContext, this_ref: Stmt, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: Stmt;
}, new_value: Stmt) => Stmt;
export declare let call_cons: (r: SourceRange, context: CallingContext, C_name: string, arg_values: Stmt[], is_internal?: boolean) => Stmt;
export declare let get_class: (r: SourceRange, t: Type) => CCC.Coroutine<State, Err, ObjType>;
export declare let coerce: (r: SourceRange, e: Stmt, t: Type) => Stmt;
