import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { Expr, Mem, Val, Bool, ArrayVal, Scope } from "./memory";
export interface BoolCat extends Fun<Unit, Sum<Unit, Unit>> {
}
export declare let FalseCat: BoolCat;
export declare let TrueCat: BoolCat;
export declare let bool_to_boolcat: Fun<Bool, BoolCat>;
export declare let unit_expr: () => Coroutine<Mem, string, Val>;
export declare let str_expr: (s: string) => Coroutine<Mem, string, Val>;
export declare let float_expr: (n: number) => Coroutine<Mem, string, Val>;
export declare let int_expr: (n: number) => Coroutine<Mem, string, Val>;
export declare let arr_expr: (a: ArrayVal) => Coroutine<Mem, string, Val>;
export declare let bool_expr: (s: boolean) => Coroutine<Mem, string, Val>;
export declare let lambda_expr: (l: Prod<Expr<Val>, string[]>) => Coroutine<Mem, string, Val>;
export declare let obj_expr: (o: Scope) => Coroutine<Mem, string, Val>;
export declare let ref_expr: (r: string) => Coroutine<Mem, string, Val>;
export declare let val_expr: (v: Val) => Coroutine<Mem, string, Val>;
export declare let bool_times: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let bool_plus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_plus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_minus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_times: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_div: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_mod: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_gt: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_lt: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_geq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_leq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_eq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let int_neq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_plus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_minus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_times: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_div: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_gt: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_lt: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_geq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_leq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_eq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let float_neq: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let string_plus: (a: Expr<Val>, b: Expr<Val>) => Expr<Val>;
export declare let bool_not: (a: Expr<Val>) => Expr<Val>;
export declare let int_minus_unary: (a: Expr<Val>) => Expr<Val>;
export declare let float_minus_unary: (a: Expr<Val>) => Expr<Val>;
export declare let string_length: (a: Expr<Val>) => Expr<Val>;
