import React from 'react';
import Field from './Field';

/**
 * A Fieldset creates a set of fields that act as a single entity
 * A Form itself is a Fieldset and can consist of multiple fieldset.
 * A Fieldset acts as a input element and provides value to the form.
 */
class Fieldset extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      inputs: {}
    }
  }

  getChildContext() {
    return {
      fieldset: this
    }
  }

  registerInput(name, component) {
    const isArray = name.endsWith("[]");
    name = isArray ? name.substr(0, name.length-2) : name;

    const inp = this.state.inputs[name];

    // if the input has not been defined, define the input
    if (inp === undefined) {
      this.state.inputs[name] = isArray ? [component] : component;
      return;
    }

    if (!isArray) {
      // Only array types are allowed to have more than one registration
      console.error("Cannot register more than one input with the same name '" + name + "'. Are you trying to register an array of input in which case use a name ending with [].");
      return;
    }

    if (!inp instanceof Array) {
      // Looks like the user has mixed up the same name with and without array def
      console.error("Looks like you have mixed up the name '" + name + "' with and without array suffix ([]) on multiple components.");
      return;
    }

    inp.push(component);
  }

  unregisterInput(name, component) {
    const isArray = name.endsWith("[]");
    name = isArray ? name.substr(0, name.length-2) : name;

    const inp = this.state.inputs[name];
    if (inp === undefined) {
      console.error("Trying to unregister a component named '" + name + "' which was not registered. Should be a bug.");
      return;
    }

    if (inp instanceof Array) {
      const idx = inp.indexOf(component);
      if (idx === -1) {
        console.error("Trying to unregister one of the component named '" + name + "' but was not found in the list. Should be a bug.");
        return;
      } else {
        inp.splice(idx, 1);
        if (inp.length === 0) {
          delete this.state.inputs[name];
        }
      }
    } else {
      if (component !== inp) {
        console.warn("Trying to unregister the component with name '" + name + "' but something else was registered on that name. Should be a bug.");
        return;
      } else {
        delete this.state.inputs[name];
      }
    }
  }

  getDefaultValue(name) {
    const isArray = name.endsWith("[]");
    name = isArray ? name.substr(0, name.length-2) : name;
    return this.props.value && this.props.value[name];
  }

  componentDidMount() {
    this.context.fieldset.registerInput(this.props.name, this);
  }

  componentWillUnmount() {
    this.context.fieldset.unregisterInput(this.props.name, this);
  }

  getFirstInput() {
    for(let name in this.state.inputs) {
      const inp = this.state.inputs[name];
      if(inp instanceof Array) {
        return inp[0];
      } else {
        return inp;
      }
    }
    return null;
  }

  getValue() {
    // retrieve the value provided by this set, the value is initialized
    // with the values provided overridden by the suppressing values and
    // finally by the input provided by the user
    const value = Object.assign({}, this.props.value, this.props.suppress);
    const inputs = Object.keys(this.state.inputs);
    let count = inputs.length;

    return new Promise( (resolve, reject) => {
      inputs.forEach(name => {
        const inp = this.state.inputs[name];
        const p = (inp instanceof Array) ?
                      Promise.all( inp.map(i => i.getValue() )):
                      inp.getValue();
        p.then( v => {
          value[name] = v;
          count -= 1;
          if (count === 0) {
            resolve(value);
          }
        });
      });
    });
  }

  validate(value) {
    const res = {};
    return new Promise( resolve => {
      const inputs = Object.keys(this.state.inputs);
      let count = inputs.length;
      inputs.forEach(name => {
        const inp = this.state.inputs[name];
        const promise = (inp instanceof Array) ?
                          Promise.all( inp.map( i => i.validate(value[name]) )):
                          inp.validate(value[name]);
        promise.then( v => {
          res[name] = v;
          count -= 1;
          if (count === 0) {
            resolve(res);
          }
        });
      })
    })
  }

  generate(attributes, suppress, value) {
    return attributes.map( attr => {
      if (suppress && suppress.hasOwnProperty(attr.name)) {
        return false;
      }

      // handle the array type fields
      const isArray = attr.name.endsWith("[]");
      const name = isArray ? attr.name.substr(0, attr.name.length-2) : attr.name;
      const defaultValue = value && value[name];

      if (isArray && (defaultValue instanceof Array)) {
        const fields = [];
        for(let i=0; i<=defaultValue.length; ++i) {
          fields.push(<Field key={name + "." + i} {...attr} value={defaultValue[i]} />);
        }
        return fields;
      } else {
        return <Field key={name} {...attr} value={defaultValue} />
      }

      //return <Field key={attr.name} {...attr} value={value[attr.name]}/>
    })
  }

  render() {
    const { className, children, value, attributes, suppress, ...other} = this.props;
    const autoChildren = attributes ? this.generate(attributes, suppress, value) : false;

    return (
      <div className={className} {...other}>
        { children }
        { autoChildren }
      </div>
    );
  }
}

Fieldset.contextTypes = {
  fieldset: React.PropTypes.object
}

Fieldset.childContextTypes = {
  fieldset: React.PropTypes.object
}

Fieldset.propTypes = {
  name: React.PropTypes.string.isRequired,
  value: React.PropTypes.object,
  attributes: React.PropTypes.arrayOf(React.PropTypes.object),
  suppress: React.PropTypes.object
}

export default Fieldset;
