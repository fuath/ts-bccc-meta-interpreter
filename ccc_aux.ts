import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state, Option, CoPreRes, CoCont, CoRet, CoRes, continuation, no_error } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Immutable from "immutable"

export let option_to_array = function<A>(x:Option<A>) : Array<A> {
  let l = fun<A,Array<A>>(x => [x])
  let r = fun<Unit,Array<A>>(_ => [])
  let f = l.plus(r)
  return apply(f, x)
}

export let some = function<A>() { return fun((x:A) => apply(inl<A,Unit>(), x)) }
export let none = function<A>() { return fun((x:Unit) => apply(inr<A,Unit>(), {}) ) }

export let option_plus = function<C,A>(p:Fun<C,Option<A>>, q:Fun<C,Option<A>>) : Fun<C,Option<A>> {
  let f = (id<C>().times(p)).then(distribute_sum_prod()).then((snd<C,A>().then(some<A>())).plus(fst<C,Unit>().then(q)))
  return fun(c => apply(f,c))
}

export let co_run_to_end = function<S,E,A>(p:Coroutine<S,E,A>,s:S) : Sum<E,Prod<A,S>> {
  let run_rec = fun2<Coroutine<S,E,A>, S, Sum<E,Prod<A,S>>>((p,s) => co_run_to_end(p,s))
  let j1:Fun<Sum<CoCont<S,E,A>, CoRet<S,E,A>>, Sum<E,Prod<A,S>>> = run_rec.plus(inr())
  let j:Fun<Sum<E, Sum<CoCont<S,E,A>, CoRet<S,E,A>>>, Sum<E,Prod<A,S>>> = inl<E,Prod<A,S>>().plus(j1)
  let i = apply(p.run.then(j),s)
  return i
}

export let co_repeat = function<S,E,A>(p:Coroutine<S,E,A>) : Coroutine<S,E,Array<A>> {
  return co_catch<S,E,Array<A>>((e1,e2)=>e1)(
    p.then(x =>
    co_repeat(p).then(xs =>
    co_unit([x, ...xs])
    )))(co_unit(Array<A>()))
}

export let comm_list_coroutine = function<S,E,A>(ps:Immutable.List<Coroutine<S,E,A>>) : Coroutine<S,E,Immutable.List<A>> {
  if (ps.isEmpty()) return co_unit<S,E,Immutable.List<A>>(Immutable.List<A>())
  let h = ps.first()
  let t = ps.rest().toList()
  return h.then(h_res =>
         comm_list_coroutine(t).then(t_res =>
         co_unit<S,E,Immutable.List<A>>(t_res.unshift(h_res))
         ))
}

export let co_lookup = <S, E, A>(p: Coroutine<S, E, A>): Coroutine<S, E, A> =>
  co_get_state<S, E>().then(s => p.then(p_res => co_set_state<S, E>(s).then(_ => co_unit(p_res))))

// Note: ugly (non categorical) version made in a hurry because Giulia, Rachel and Rebecca are screaming in my ears
// and I just want to get started on the actual parser.
export let co_not = <S, E, A>(e:E) => (p: Coroutine<S, E, A>) : Coroutine<S, E, Unit> =>
  mk_coroutine<S,E,Unit>(fun(s => {
    let res = p.run.f(s)
    if (res.kind == "left") { // error case
      let f = inr<CoCont<S,E,Unit>, CoRet<S,E,Unit>>().then(inr<E,CoRes<S,E,Unit>>())
      let res1:Prod<Unit,S> = {fst:{}, snd:s}
      return f.f(res1)
    }
    if (res.value.kind == "left") { // continuation case
      let k = res.value.value.fst
      let s1 = res.value.value.snd
      let k1 = co_not<S,E,A>(e)(k)
      let res1 = k1.run.f(s1)
      return res1
    }
    return inl<E,CoRes<S,E,Unit>>().f(e)
  }))

export let co_catch = <S, E, A>(merge_errors:(e1:E,e2:E)=>E) => (p: Coroutine<S, E, A>) => (on_err:Coroutine<S,E,A>) : Coroutine<S, E, A> =>
  mk_coroutine<S,E,A>(fun(s => {
    let res = p.run.f(s)
    if (res.kind == "left") { // error case
      let e1 = res.value
      let k = co_map_error<S,E,E,A>(e2 => merge_errors(e1,e2))(on_err)
      return k.run.f(s)
    }
    if (res.value.kind == "left") { // continuation case
      let k = res.value.value.fst
      let s1 = res.value.value.snd
      let k1 = co_catch<S,E,A>(merge_errors)(k)(co_set_state<S,E>(s).then(_ => on_err))
      return apply(continuation<S,E,A>().then(no_error<S,E,A>()), { fst:k1, snd:s1 })
    }
    return res
  }))

export let co_catch_many = <S, E, A>(empty_error:E) => (p: Immutable.List<Coroutine<S, E, A>>) : Coroutine<S, E, A> =>
  p.isEmpty() ? co_error<S,E,A>(empty_error)
  : co_catch<S,E,A>((_,e) => e)(p.first())(co_catch_many<S,E,A>(empty_error)(p.skip(1).toList()))

export let co_map_error = <S, E, E1, A>(f:(_:E) => E1) => (p:Coroutine<S,E,A>) : Coroutine<S, E1, A> =>
  mk_coroutine<S,E1,A>(fun(
    s => {
    let res = p.run.f(s)
    if (res.kind == "left") { // error case
      let g:CoPreRes<S,E1,A> = apply(inl<E1, CoRes<S,E1,A>>(), f(res.value))
      return g
    }
    if (res.value.kind == "left") { // continuation case
      let k = res.value.value.fst
      let s1 = res.value.value.snd
      let k1:Coroutine<S,E1,A> = co_map_error<S,E,E1,A>(f)(k)
      return apply(continuation<S,E1,A>().then(no_error<S,E1,A>()), { fst:k1, snd:s1 })
    }
    let actual_res = res.value.value
    let h:CoPreRes<S,E1,A> = apply(inr<E1,CoRes<S,E1,A>>().after(inr<CoCont<S,E1,A>,CoRet<S,E1,A>>()), actual_res)
    return h
  }))

export let co_stateless = <S, E, A>(p:Coroutine<S,E,A>) : Coroutine<S, E, A> => {
  return  co_get_state<S,E>().then(s =>
          p.then(p_res =>
          co_set_state<S,E>(s).then(_ =>
          co_unit(p_res))))
}
