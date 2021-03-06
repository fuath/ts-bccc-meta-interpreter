import * as Immutable from 'immutable';

import { ValueName, done_rt } from '../main'
import { join_source_ranges, print_range } from '../source_range'
import {
  and,
  arrow,
  bool,
  breakpoint,
  call_cons,
  call_lambda,
  decl_and_init_v,
  decl_v,
  def_class,
  def_generic_class,
  def_fun,
  div,
  done,
  double,
  eq,
  field_get,
  field_set,
  float,
  for_loop,
  geq,
  get_arr_el,
  get_v,
  gt,
  if_then_else,
  int,
  leq,
  lt,
  minus,
  mk_circle,
  mk_ellipse,
  mk_empty_surface,
  mk_line,
  mk_other_surface,
  mk_polygon,
  mk_rectangle,
  mk_sprite,
  mk_square,
  mk_text,
  mod,
  neq,
  new_array,
  new_array_and_init,
  not,
  or,
  plus,
  ret,
  semicolon,
  set_arr_el,
  set_v,
  str,
  times,
  typechecker_breakpoint,
  while_do,
  xor,
  tuple_value,
  coerce,
  mk_fs_key_value,
  mk_filesystem_and_program,
  mk_filesystem,
  mk_fs_file,
} from './bindings'
import {
  float_type,
  double_type,
  arr_type,
  bool_type,
  CallingContext,
  circle_type,
  ellipse_type,
  fun_type,
  int_type,
  record_type,
  generic_type_instance,
  rectangle_type,
  ref_type,
  render_grid_pixel_type,
  render_grid_type,
  render_surface_type,
  string_type,
  tuple_type,
  Type,
  unit_type,
  var_type,
  sprite_type,
  square_type,
  Stmt,
  type_to_string,
  State,
  Err,
  Typing,
  try_unbind,
  try_bind,
  MethodDefinition,
} from './types'
import { ParserRes } from './grammar'
import { inr, apply, inl, Unit, co_error, co_get_state, co_unit, Option } from 'ts-bccc';
import { mk_constructor_call, mk_semicolon, mk_assign, mk_field_ref } from './primitives';

let ast_to_csharp_type = (substitutions:Immutable.Map<string,Type>) => (s:ParserRes) : Type =>
  s.ast.kind == "id" ?
    s.ast.value == "int" ? int_type
    : s.ast.value == "float" ? float_type
    : s.ast.value == "double" ? double_type
    : s.ast.value == "bool" ? bool_type
    : s.ast.value == "string" ? string_type
    : s.ast.value == "void" ? unit_type
    : s.ast.value == "RenderGrid" ? render_grid_type
    : s.ast.value == "RenderGridPixel" ? render_grid_pixel_type
    : s.ast.value == "surface" ? render_surface_type
    : s.ast.value == "sprite" ? sprite_type
    : s.ast.value == "circle" ? circle_type
    : s.ast.value == "square" ? square_type
    : s.ast.value == "ellipse" ? ellipse_type
    : s.ast.value == "rectangle" ? rectangle_type
    : s.ast.value == "var" ? var_type
    : substitutions.has(s.ast.value) ? substitutions.get(s.ast.value) : ref_type(s.ast.value)
  :
  s.ast.kind == "array decl" ? arr_type(ast_to_csharp_type(substitutions)(s.ast.t))
  : s.ast.kind == "generic type inst" && s.ast.f.ast.kind == "id" && s.ast.f.ast.value == "Func" && s.ast.args.length >= 1 ?
    fun_type(tuple_type(Immutable.Seq(s.ast.args).take(s.ast.args.length - 1).toArray().map(a => ast_to_csharp_type(substitutions)(a))), ast_to_csharp_type(substitutions)(s.ast.args[s.ast.args.length - 1]), s.range)
  : s.ast.kind == "generic type inst" && s.ast.f.ast.kind == "id" ?
    generic_type_instance(s.ast.f.ast.value, s.ast.args.map(a => ast_to_csharp_type(substitutions)(a)))
  : s.ast.kind == "tuple type decl" ?
    tuple_type(s.ast.args.map(a => ast_to_csharp_type(substitutions)(a)))
  : s.ast.kind == "record type decl" ?
    record_type(Immutable.Map<string,Type>(s.ast.args.map(a => [a.r.ast.kind == "id" ? a.r.ast.value : "", ast_to_csharp_type(substitutions)(a.l)])))
  : (() => {
    //console.log(`Error: unsupported ast type: ${JSON.stringify(s)}`);
    throw new Error(`Unsupported ast type: ${print_range(s.range)}`)
  })()

export let global_calling_context:CallingContext =  ({ kind:"global scope" })

let union_many = <a>(a:Array<Immutable.Set<a>>) : Immutable.Set<a> => {
  let res = Immutable.Set<a>()
  a.forEach(x => { res = res.union(x)})
  return res
}

let free_variables = (n:ParserRes, bound:Immutable.Set<ValueName>) : Immutable.Set<ValueName> =>
  n.ast.kind == ";" || n.ast.kind == "+" || n.ast.kind == "-" || n.ast.kind == "/" || n.ast.kind == "*"
  || n.ast.kind == "%" || n.ast.kind == "<" || n.ast.kind == ">" || n.ast.kind == "<=" || n.ast.kind == ">="
  || n.ast.kind == "==" || n.ast.kind == "!=" || n.ast.kind == "xor" || n.ast.kind == "&&" || n.ast.kind == "||"
  || n.ast.kind == "," || n.ast.kind == "as" ?
    free_variables(n.ast.l, bound).union(free_variables(n.ast.r, bound))

  : n.ast.kind == "empty surface" ?
    free_variables(n.ast.w, bound).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound))
  : n.ast.kind == "circle" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.r, bound))
        .union(free_variables(n.ast.color, bound))
  : n.ast.kind == "square" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.s, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "rectangle" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "ellipse" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "sprite" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.sprite, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "line" ?
    free_variables(n.ast.x1, bound).union(free_variables(n.ast.y1, bound)).union(free_variables(n.ast.x2, bound)).union(free_variables(n.ast.y2, bound))
        .union(free_variables(n.ast.width, bound)).union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "text" ?
    free_variables(n.ast.x, bound).union(free_variables(n.ast.y, bound)).union(free_variables(n.ast.t, bound)).union(free_variables(n.ast.size, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "polygon" ?
    free_variables(n.ast.color, bound).union(free_variables(n.ast.rotation, bound))
        .union(free_variables(n.ast.points, bound))
  : n.ast.kind == "other surface" ?
    free_variables(n.ast.s, bound).union(free_variables(n.ast.dx, bound)).union(free_variables(n.ast.dy, bound))
        .union(free_variables(n.ast.sx, bound)).union(free_variables(n.ast.sy, bound))


  // export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
  // export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }

  : n.ast.kind == "not" || n.ast.kind == "bracket" ? free_variables(n.ast.e, bound)
  : n.ast.kind == "return" ? free_variables(n.ast.value, bound)

  : n.ast.kind == "if" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.t, bound)).union(n.ast.e.kind == "left" ? free_variables(n.ast.e.value, bound) : Immutable.Set<string>())
  : n.ast.kind == "while" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.b, bound))

  : n.ast.kind == "ternary_if" ? free_variables(n.ast.condition, bound).union(free_variables(n.ast.then_else, bound))
  : n.ast.kind == "ternary_then_else" ? free_variables(n.ast._then, bound).union(free_variables(n.ast._else, bound))

  : n.ast.kind == "=>" && n.ast.l.ast.kind == "id" ? free_variables(n.ast.r, bound.add(n.ast.l.ast.value))
  : n.ast.kind == "id" ? (!bound.has(n.ast.value) ? Immutable.Set<ValueName>([n.ast.value]) : Immutable.Set<ValueName>())
  : n.ast.kind == "int" || n.ast.kind == "double" || n.ast.kind == "float" ||n.ast.kind == "string" || n.ast.kind == "bool" || n.ast.kind == "get_array_value_at" || n.ast.kind == "array_cons_call_and_init" ?  Immutable.Set<ValueName>()
  : n.ast.kind == "func_call" ? free_variables(n.ast.name, bound).union(union_many(n.ast.actuals.map(a => free_variables(a, bound))))
  : n.ast.kind == "cons_call" ? union_many(n.ast.actuals.map(a => free_variables(a, bound)))

  : n.ast.kind == "debugger" || n.ast.kind == "typechecker_debugger" ? Immutable.Set<string>()

  : (() => {
    console.log(`Error (FV): unsupported ast node: ${JSON.stringify(n)}`);
    throw new Error(`(FV) Unsupported ast node: ${print_range(n.range)}`)
  })()


export let extract_tuple_args = (n:ParserRes) : Array<ParserRes> =>
  {
  return n.ast.kind == "," ? [n.ast.l, ...extract_tuple_args(n.ast.r)]
  : n.ast.kind == "bracket" ? extract_tuple_args(n.ast.e)
  : [n]}

export let ast_to_type_checker = (substitutions:Immutable.Map<string,Type>) => (n:ParserRes) => (context:CallingContext) : Stmt =>
  n.ast.kind == "int" ? int(n.range, n.ast.value)
  : n.ast.kind == "double" ? double(n.range, n.ast.value)
  : n.ast.kind == "float" ? float(n.range, n.ast.value)
  : n.ast.kind == "string" ? str(n.range, n.ast.value)
  : n.ast.kind == "bracket" ? ast_to_type_checker(substitutions)(n.ast.e)(context)
  : n.ast.kind == "bool" ? bool(n.range, n.ast.value)
  : n.ast.kind == "noop" ? done
  : n.ast.kind == ";" ? semicolon(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "for" ? for_loop(n.range, ast_to_type_checker(substitutions)(n.ast.i)(context), ast_to_type_checker(substitutions)(n.ast.c)(context), ast_to_type_checker(substitutions)(n.ast.s)(context), ast_to_type_checker(substitutions)(n.ast.b)(context))
  : n.ast.kind == "while" ? while_do(n.range, ast_to_type_checker(substitutions)(n.ast.c)(context), ast_to_type_checker(substitutions)(n.ast.b)(context))
  : n.ast.kind == "if" ? if_then_else(n.range, ast_to_type_checker(substitutions)(n.ast.c)(context), ast_to_type_checker(substitutions)(n.ast.t)(context),
                            n.ast.e.kind == "right" ? done : ast_to_type_checker(substitutions)(n.ast.e.value)(context))
  : n.ast.kind == "as" ? coerce(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_csharp_type(substitutions)(n.ast.r), done_rt)
  : n.ast.kind == "+" ? plus(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context),
                                             ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "-" ? minus(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context),
                                              ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "*" ? times(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context),
                                              ast_to_type_checker(substitutions)(n.ast.r)(context), n.range)
  : n.ast.kind == "/" ? div(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "%" ? mod(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "<" ? lt(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == ">" ? gt(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "<=" ? leq(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == ">=" ? geq(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "==" ? eq(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "!=" ? neq(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "xor" ? xor(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "not" ? not(n.range, ast_to_type_checker(substitutions)(n.ast.e)(context))
  : n.ast.kind == "&&" ? and(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "||" ? or(n.range, ast_to_type_checker(substitutions)(n.ast.l)(context), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "=>" ? arrow(n.range,
      extract_tuple_args(n.ast.l).filter(e => e.ast.kind != "unit").map(a => {
        if (a.ast.kind != "id") {
          //console.log(`Error: unsupported ast node: ${print_range(n.range)}`)
          throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
        }
        return { name:a.ast.value, type:var_type }
      }),
      // [ { name:n.ast.l.ast.value, type:var_type } ],      
      free_variables(n.ast.r, Immutable.Set<ValueName>(extract_tuple_args(n.ast.l).filter(e => e.ast.kind != "unit").map(a => {
        if (a.ast.kind != "id") {
          //console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`)
          throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
        }
        return a.ast.value
      }))).toArray(), ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "," ? tuple_value(n.range, ([n.ast.l].concat(extract_tuple_args(n.ast.r))).map(a => ast_to_type_checker(substitutions)(a)(context)))
  : n.ast.kind == "id" ? get_v(n.range, n.ast.value)
  : n.ast.kind == "return" ? ret(n.range, ast_to_type_checker(substitutions)(n.ast.value)(context))
  : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? 
    field_get(n.range, context, ast_to_type_checker(substitutions)(n.ast.l)(context), {name:n.ast.r.ast.value, 
                                                                                       params: n.ast.r.ast.optional_params.map(p => ast_to_csharp_type(substitutions)(p))})
  : n.ast.kind == "ternary_if" && n.ast.then_else.ast.kind == "ternary_then_else" ?
    if_then_else(n.range, ast_to_type_checker(substitutions)(n.ast.condition)(context), ast_to_type_checker(substitutions)(n.ast.then_else.ast._then)(context), ast_to_type_checker(substitutions)(n.ast.then_else.ast._else)(context))


  : n.ast.kind == "=" && n.ast.l.ast.kind == "get_array_value_at" ?
    set_arr_el(n.range,
                      ast_to_type_checker(substitutions)(n.ast.l.ast.array)(context),
                      ast_to_type_checker(substitutions)(n.ast.l.ast.index)(context),
                      ast_to_type_checker(substitutions)(n.ast.r)(context))


  : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? set_v(n.range, n.ast.l.ast.value, ast_to_type_checker(substitutions)(n.ast.r)(context))
  : n.ast.kind == "=" && n.ast.l.ast.kind == "." && n.ast.l.ast.r.ast.kind == "id" ?
    field_set(n.range, context, ast_to_type_checker(substitutions)(n.ast.l.ast.l)(context), {att_name:n.ast.l.ast.r.ast.value, kind:"att"}, ast_to_type_checker(substitutions)(n.ast.r)(context))



  : n.ast.kind == "cons_call" ?
    call_cons(n.range, context, n.ast.type_args.length == 0 ? n.ast.name : `${n.ast.name}<${n.ast.type_args.map(a => type_to_string(ast_to_csharp_type(substitutions)(a))).reduce((a,b) => a + "," + b)}>`, n.ast.actuals.map(a => ast_to_type_checker(substitutions)(a)(context)), n.ast.name, n.ast.type_args.map(a => ast_to_csharp_type(substitutions)(a)))
  : n.ast.kind == "func_call" ?
    call_lambda(n.range, ast_to_type_checker(substitutions)(n.ast.name)(context), n.ast.actuals.map(a => ast_to_type_checker(substitutions)(a)(context)))


  : n.ast.kind == "func_decl" ?
    def_fun(n.range,
      { name:n.ast.name,
        return_t:ast_to_csharp_type(substitutions)(n.ast.return_type),
        parameters:n.ast.arg_decls.toArray().map(d => ({name:d.r.ast.kind == "id" ? d.r.ast.value : "", type:ast_to_csharp_type(substitutions)(d.l)})),
        body:ast_to_type_checker(substitutions)(n.ast.body)(context),
        range:n.range },
        []
        // free_variables(n.ast.body,
        //   Immutable.Set<string>(n.ast.arg_decls.toArray().map(d => d.r.ast.kind == "id" ? d.r.ast.value : ""))).toArray()
        )
  : n.ast.kind == "class" && n.ast.generic_parameters.length == 0 ?
    def_class(n.range,
      n.ast.modifiers.toArray().map(m => m.kind),
      (n.ast.modifiers.toArray().some(m => m.kind == "abstract")  ? "abstract" :
      n.ast.modifiers.toArray().some(m => m.kind == "interface")  ? "interface" : "normal") as "normal" | "abstract" | "interface",
      n.ast.C_name,
      n.ast.extends_or_implements.map(e => ({...e, type:ast_to_csharp_type(Immutable.Map<string, Type>())(e.ast)})),

      n.ast.methods.toArray().filter(m => m.decl.generic_parameters.length == 0).map(m => (context:CallingContext) => ({
          name:m.decl.name,
          return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
          params_base_call: apply(inr<Stmt[], Unit>(), {}),
          parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
          body:ast_to_type_checker(substitutions)(m.decl.body)(context),
          range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
          modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
          is_constructor:false
        })).concat(
        n.ast.constructors.toArray().map(c => (context:CallingContext) => ({
          name:c.decl.name,
          params_base_call: c.decl.params_base_call.kind == "left"
                            ? apply(inl<Stmt[], Unit>(), c.decl.params_base_call.value.map(e => ast_to_type_checker(substitutions)(e)(context)))
                            : apply(inr<Stmt[], Unit>(), {}),//c.decl.params_base_call,
          return_t:unit_type,
          parameters:c.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
          body:ast_to_type_checker(substitutions)(c.decl.body)(context),
          range:c.decl.body.range,
          modifiers:c.modifiers.toArray().map(mod => mod.ast.kind),
          is_constructor:true
        }))),
      n.ast.methods.toArray().filter(m => m.decl.generic_parameters.length >= 0).map(m => (context:CallingContext) => ({
        name:m.decl.name,
        return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
        params_base_call: apply(inr<Stmt[], Unit>(), {}),
        parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
        body:(s:Immutable.Map<string, Type>, name:string) => 
          {
            substitutions = substitutions.merge(s)
            let res:MethodDefinition = {
                name:name,
                return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
                params_base_call: apply(inr<Stmt[], Unit>(), {}),
                parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
                body:ast_to_type_checker(substitutions.merge(s))(m.decl.body)(context),
                range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
                modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
                is_constructor:false,
              }
            
            return res
          
          
          },
        range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
        modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
        is_constructor:false,
        params: m.decl.generic_parameters.map(p => ({name: p.ast.kind == "id" ? p.ast.value : "?", variance: "inv" as "co" | "contra" | "inv"}))
      })).concat(
      n.ast.generic_methods.toArray().map(m => (context:CallingContext) => ({
        name:m.decl.name,
        return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
        params_base_call: apply(inr<Stmt[], Unit>(), {}),
        parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
        body:(s:Immutable.Map<string, Type>, name:string) => 
          {
            substitutions = substitutions.merge(s)
            let res:MethodDefinition = {
                name:name,
                return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
                params_base_call: apply(inr<Stmt[], Unit>(), {}),
                parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
                body:ast_to_type_checker(substitutions.merge(s))(m.decl.body)(context),
                range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
                modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
                is_constructor:false,
              }
            
            return res
          
          
          },
        range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
        modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
        is_constructor:false,
        params: m.decl.generic_parameters.map(p => ({name: p.ast.kind == "id" ? p.ast.value : "?", variance: "inv" as "co" | "contra" | "inv"}))
      }))),
      n.ast.fields.toArray().map(f => (context:CallingContext) => ({
        name:f.decl.r.ast.kind == "id" ? f.decl.r.ast.value : "",
        type:ast_to_csharp_type(substitutions)(f.decl.l),
        is_used_as_base:false,
        modifiers:f.modifiers.toArray().map(mod => mod.ast.kind),
        initial_value:f.decl.kind == "decl" ? inr<Stmt, Unit>().f({}) : apply(inl<Stmt, Unit>(), ast_to_type_checker(substitutions)(f.decl.v)(context))
      }))
    )
  : n.ast.kind == "class" && n.ast.generic_parameters.length > 0 && !n.ast.generic_parameters.some(p => p.name.ast.kind != "id") ?
    def_generic_class(n.range, n.ast.C_name, n.ast.generic_parameters.map(p => ({ name:p.name.ast.kind == "id" ? p.name.ast.value : "_anonymous_type_parameter?", variance:p.variant })),
    (generic_arguments:Immutable.Map<string, Type>, is_visible?:boolean) : Stmt => {
      return constraints => {
      if (n.ast.kind != "class")
        return co_error<State, Err, Typing>({ range: n.range, message: `Error: cannot instantiate ${n.ast} as it is not a class` })
      let generic_params = n.ast.generic_parameters.map(p => p.name.ast.kind == "id" ? p.name.ast.value : "_anonymous_type_parameter?")
      let C_name = n.ast.C_name
      let C_name_inst = generic_params.length == 0 ? C_name : `${C_name}<${generic_params.map(p => type_to_string(generic_arguments.get(p))).reduce((a,b) => a + "," + b)}>`
      // console.log(`Instantiating generic type ${n.ast.C_name} into ${C_name_inst}`)
      let type_parameter_names = n.ast.generic_parameters.map(p => p.name.ast.kind == "id" ? p.name.ast.value : "_anonymous_type_parameter?")
      if (type_parameter_names.length != generic_arguments.count() || type_parameter_names.some(p => !generic_arguments.has(p)))
      return co_error<State, Err, Typing>({ range: n.range, message: `Error: cannot instantiate ${C_name}: not all parameters were correctly bound.` })
      
      let substitutions = generic_arguments
      
      let range = n.range
      let ast = n.ast
      
      return try_unbind("this").then(prev_this => def_class(range,
        ast.modifiers.toArray().map(m => m.kind),
        (ast.modifiers.toArray().some(m => m.kind == "abstract")  ? "abstract" :
        ast.modifiers.toArray().some(m => m.kind == "interface")  ? "interface" : "normal") as "normal" | "abstract" | "interface",
        C_name_inst, ast.extends_or_implements.map(e => ({...e, type:ast_to_csharp_type(substitutions)(e.ast)})),
        ast.methods.toArray().filter(m => m.decl.generic_parameters.length == 0).map(m => (context:CallingContext) => ({
            name:m.decl.name,
            return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
            params_base_call: apply(inr<Stmt[], Unit>(), {}),
            parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
            body:ast_to_type_checker(substitutions)(m.decl.body)(context),
            range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
            modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
            is_constructor:false
          })).concat(
          ast.constructors.toArray().map(c => (context:CallingContext) => ({
            name:C_name_inst,
            params_base_call: c.decl.params_base_call.kind == "left"
                              ? apply(inl<Stmt[], Unit>(), c.decl.params_base_call.value.map(e => ast_to_type_checker(substitutions)(e)(context)))
                              : apply(inr<Stmt[], Unit>(), {}),
            return_t:unit_type,
            parameters:c.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
            body:ast_to_type_checker(substitutions)(c.decl.body)(context),
            range:c.decl.body.range,
            modifiers:c.modifiers.toArray().map(mod => mod.ast.kind),
            is_constructor:true
          }))),
        ast.methods.toArray().filter(m => m.decl.generic_parameters.length >= 0).map(m => (context:CallingContext) => ({
            name:m.decl.name,
            return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
            params_base_call: apply(inr<Stmt[], Unit>(), {}),
            parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
            body:(s:Immutable.Map<string, Type>, name:string) => 
              {
                substitutions = substitutions.merge(s)
                let res:MethodDefinition = {
                    name:name,
                    return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
                    params_base_call: apply(inr<Stmt[], Unit>(), {}),
                    parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
                    body:ast_to_type_checker(substitutions.merge(s))(m.decl.body)(context),
                    range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
                    modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
                    is_constructor:false,
                  }
                
                return res
              
              
              },
            range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
            modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
            is_constructor:false,
            params: m.decl.generic_parameters.map(p => ({name: p.ast.kind == "id" ? p.ast.value : "?", variance: "inv" as "co" | "contra" | "inv"}))
          })).concat(
        ast.generic_methods.toArray().map(m => (context:CallingContext) => ({
          name:m.decl.name,

          return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
          params_base_call: apply(inr<Stmt[], Unit>(), {}),
          parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
          body:(s:Immutable.Map<string, Type>, name:string) => {
            substitutions = substitutions.merge(s)
            let res:MethodDefinition = {
                name:name,
                return_t:ast_to_csharp_type(substitutions)(m.decl.return_type),
                params_base_call: apply(inr<Stmt[], Unit>(), {}),
                parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(substitutions)(a.l) })),
                body:ast_to_type_checker(substitutions.merge(s))(m.decl.body)(context),
                range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
                modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
                is_constructor:false,
              }
            
            return res
          },
          range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
          modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
          is_constructor:false,
          params: m.decl.generic_parameters.map(p => ({name: p.ast.kind == "id" ? p.ast.value : "?", variance: "inv" as "co" | "contra" | "inv"  }))
        }))),
        ast.fields.toArray().map(f => (context:CallingContext) => ({
          name:f.decl.r.ast.kind == "id" ? f.decl.r.ast.value : "",
          type:ast_to_csharp_type(substitutions)(f.decl.l),
          is_used_as_base:false,
          modifiers:f.modifiers.toArray().map(mod => mod.ast.kind),
          initial_value:f.decl.kind == "decl" ? inr<Stmt, Unit>().f({}) : apply(inl<Stmt, Unit>(), ast_to_type_checker(substitutions)(f.decl.v)(context))
        })), !is_visible
      )(constraints).then(res => try_bind("this", prev_this).then(_ => co_unit(res)))) } })

  : n.ast.kind == "decl" && n.ast.r.ast.kind == "id" ?
    decl_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(substitutions)(n.ast.l))
  : n.ast.kind == "decl and init" && n.ast.r.ast.kind == "id" ?
    decl_and_init_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(substitutions)(n.ast.l), ast_to_type_checker(substitutions)(n.ast.v)(context))
  : n.ast.kind == "debugger" ?
    breakpoint(n.range)(done)
  : n.ast.kind == "typechecker_debugger" ?
    typechecker_breakpoint(n.range)(done)

  : n.ast.kind == "array_cons_call" ?
    new_array(n.range, ast_to_csharp_type(substitutions)(n.ast.type), ast_to_type_checker(substitutions)(n.ast.actual)(context))
  : n.ast.kind == "array_cons_call_and_init" ?
    new_array_and_init(n.range, ast_to_csharp_type(substitutions)(n.ast.type), n.ast.actuals.map(a => ast_to_type_checker(substitutions)(a)(context)))
  : n.ast.kind == "get_array_value_at" ?
    get_arr_el(n.range, ast_to_type_checker(substitutions)(n.ast.array)(context), ast_to_type_checker(substitutions)(n.ast.index)(context))



  : n.ast.kind == "empty surface" ?
    mk_empty_surface(n.range, ast_to_type_checker(substitutions)(n.ast.w)(context), ast_to_type_checker(substitutions)(n.ast.h)(context), ast_to_type_checker(substitutions)(n.ast.color)(context))
  : n.ast.kind == "circle" ?
    mk_circle(n.range, ast_to_type_checker(substitutions)(n.ast.cx)(context), ast_to_type_checker(substitutions)(n.ast.cy)(context), ast_to_type_checker(substitutions)(n.ast.r)(context), ast_to_type_checker(substitutions)(n.ast.color)(context))
  : n.ast.kind == "square" ?
    mk_square(n.range, ast_to_type_checker(substitutions)(n.ast.cx)(context), ast_to_type_checker(substitutions)(n.ast.cy)(context), ast_to_type_checker(substitutions)(n.ast.s)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "ellipse" ?
    mk_ellipse(n.range, ast_to_type_checker(substitutions)(n.ast.cx)(context), ast_to_type_checker(substitutions)(n.ast.cy)(context), ast_to_type_checker(substitutions)(n.ast.w)(context), ast_to_type_checker(substitutions)(n.ast.h)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "rectangle" ?
    mk_rectangle(n.range, ast_to_type_checker(substitutions)(n.ast.cx)(context), ast_to_type_checker(substitutions)(n.ast.cy)(context), ast_to_type_checker(substitutions)(n.ast.w)(context), ast_to_type_checker(substitutions)(n.ast.h)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "line" ?
    mk_line(n.range, ast_to_type_checker(substitutions)(n.ast.x1)(context), ast_to_type_checker(substitutions)(n.ast.y1)(context), ast_to_type_checker(substitutions)(n.ast.x2)(context), ast_to_type_checker(substitutions)(n.ast.y2)(context), ast_to_type_checker(substitutions)(n.ast.width)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "polygon" ?
    mk_polygon(n.range, ast_to_type_checker(substitutions)(n.ast.points)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "text" ?
    mk_text(n.range, ast_to_type_checker(substitutions)(n.ast.t)(context), ast_to_type_checker(substitutions)(n.ast.x)(context), ast_to_type_checker(substitutions)(n.ast.y)(context), ast_to_type_checker(substitutions)(n.ast.size)(context), ast_to_type_checker(substitutions)(n.ast.color)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "sprite" ?
    mk_sprite(n.range, ast_to_type_checker(substitutions)(n.ast.sprite)(context), ast_to_type_checker(substitutions)(n.ast.cx)(context), ast_to_type_checker(substitutions)(n.ast.cy)(context), ast_to_type_checker(substitutions)(n.ast.w)(context), ast_to_type_checker(substitutions)(n.ast.h)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "other surface" ?
    mk_other_surface(n.range, ast_to_type_checker(substitutions)(n.ast.s)(context), ast_to_type_checker(substitutions)(n.ast.dx)(context), ast_to_type_checker(substitutions)(n.ast.dy)(context), ast_to_type_checker(substitutions)(n.ast.sx)(context), ast_to_type_checker(substitutions)(n.ast.sy)(context), ast_to_type_checker(substitutions)(n.ast.rotation)(context))
  : n.ast.kind == "filesystem+program" ?
    mk_filesystem_and_program(n.range, ast_to_type_checker(substitutions)(n.ast.filesystem)(context), ast_to_type_checker(substitutions)(n.ast.program)(context))
  : n.ast.kind == "filesystem" ?
    mk_filesystem(n.range, n.ast.nodes.toArray().map(n => ast_to_type_checker(substitutions)(n)(context)))
  : n.ast.kind == "filesystem.file" ?
    mk_fs_file(n.range, ast_to_type_checker(substitutions)(n.ast.path)(context), n.ast.attributes.toArray().map(n => ast_to_type_checker(substitutions)(n)(context)))
  : n.ast.kind == "filesystem.keyvalue" ?
    mk_fs_key_value(n.range, ast_to_type_checker(substitutions)(n.ast.key)(context), ast_to_type_checker(substitutions)(n.ast.value)(context))
  : (() => {
    //console.log(`Error: unsupported ast node: ${JSON.stringify(print_range(n.range))}`);
    throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
  })()
