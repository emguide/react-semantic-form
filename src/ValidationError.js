class ValidationError {
  constructor(element, name, message) {
    Object.defineProperties(this, {
      name: { value: name },
      message: { value: message },
      element: { value: element }
    })
  }

  toString() {
    return this.message;
  }
}

export default ValidationError;
