import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';

export module ImpLanguageWithSuspend {
  let run_to_end = <S,E,A>(log:(s:string,x:any) => void) : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>(log).f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let get_stream = DebuggerStream.get_stream

export let test_parser = () => {
    let source = `
class C<a> {
  a x;
  public C(a x) { this.x = x; }
  public a get_x() { return this.x; }
  public b map<b>(Func<a,b> f) { return new C<b>(f(this.get_x())); }
}

var c_int = new C<int>(10);
var c_bool = c.map<bool>(x => x > 0);
typechecker_debugger;
`


// test 2
// interface I
// {
//   bool M(int x, string y);
// }

// class C<a> : I where a : I {
//   public bool M(int x, string y)
//   {
//     return x > y.Length;
//   }

//   public bool N(a x, a y) {
//     return x.M(10, "dieci") && y.M(11, "undici");
//   }
// }

// test 3
// interface I<a>
// {
//   bool cmp(a other);
// }

// class C<a> where a : I<a> {
//   public bool N(a x, a y) {
//     return x.cmp(y);
//   }
// }


    // let hrstart = process.hrtime()

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    // let hrdiff = process.hrtime(hrstart)
    // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    let stream = get_stream(source,  CCC.apply(CCC.inr(), {}))
    while (stream.kind == "step") {
      let show = stream.show()

      //{ highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }


      log("Step:",
      show.kind == "bindings" ? show.state.bindings.filter(c => c != undefined && (c.kind != "obj" || !c.is_internal)) :
      show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
      show)
      stream = stream.next()
    }
    let show = stream.show()
    log("Step:", show.kind == "bindings" ? show.state :
    show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
    show)

    // if (show.kind == "memory")
    //   console.log(show.memory.classes.map((c, C_name) => c != undefined && C_name != undefined ? [C_name, c.is_internal] : []))

    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
