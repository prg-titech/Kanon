class const_exp {
    constructor(num) {
        this.num = num;
    }

    value_of(Env) {
        return this.num;
    }
}

class diff_exp {
    constructor(exp1, exp2) {
        this.exp1 = exp1;
        this.exp2 = exp2;
    }

    value_of(Env) {
        return this.exp1.value_of(Env) - this.exp2.value_of(Env);
    }
}

class is_zero {
    value_of(Env) {
        return this.exp1.value_of(Env) == 0;
    }
}

class if_exp {
    value_of(Env) {
        if (this.exp1.value_of(Env)) {
            return this.exp2.value_of(Env);
        } else {
            return this.exp3.value_of(Env);
        }
    }
}

class var_exp {
    constructor(Var) {
        this.var = Var;
    }

    value_of(Env) {
        return apply_env(Env, this.var);
    }
}

class let_exp {
    value_of(Env) {
        return this.body.value_of(extend_env(this.Var, this.exp1.value_of(Env), Env));
    }
}

class proc_exp {
    constructor(identifier, body) {
        this.identifier = identifier;
        this.body = body;
    }

    value_of(Env) {
        var proc = new procedure(this.identifier, this.body, Env);
        return proc;
    }
}

class call_exp {
    value_of(Env) {
        var proc = this.rator.value_of(Env);
        var arg = this.rand.value_of(Env);
        return apply_procedure(proc, arg);
    }
}

class procedure {
    constructor(Var, body, Env) {
        this.Var = Var;
        this.body = body;
        this.Env = Env;
    }
}

function apply_procedure(proc, val) {
    return proc.body.value_of(extend_env(proc.Var, val, proc.Env));
}


class Environment {
    constructor(Var, Val) {
        this.Var = Var;
        this.Val = Val;
        this.Env = null;
    }
}

function extend_env(Var, Val, Env) {
    var newenv = new Environment(Var, Val);
    newenv.Env = Env;
    return newenv;
}

function apply_env(Env, Var) {
    if (Env.Var == Var) {
        return Env.Val;
    } else {
        apply_env(Env.Env, Var);
    }
}

class expressionEnvironment {
    constructor(Var, Val) {
        this.Var = Var;
        this.Val = Val;
        this.env = null;
    }
}

function expression_extend_env(Var, Val, Env) {
    var newenv = new expressionEnvironment(Var, Val);
    newenv.env = Env;
    return newenv;
}


var four = new const_exp(4);
var seven = new const_exp(7);
var var_a = new var_exp("a");
var var_b = new var_exp("b");
var var_x = new var_exp("x");
var var_y = new var_exp("y");
var var_f = new var_exp("f");
var var_g = new var_exp("g");
var env = new expressionEnvironment(var_a, four);
var env2 = expression_extend_env(var_b, seven, env);
var proc1 = new proc_exp("x", new diff_exp(var_x, var_a));
var proc3 = new proc_exp("y", new diff_exp(var_x, var_y));
var proc2 = new proc_exp("x", proc3);
var env3 = expression_extend_env(var_f, proc1, env2);
var env4 = expression_extend_env(var_g, proc2, env2);