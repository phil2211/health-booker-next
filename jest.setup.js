// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill Request and Response for Jest with jsdom
// Node.js 18+ has these built-in, but jsdom doesn't expose them
// Create minimal polyfills instead of using undici (which requires many Web APIs)
if (typeof global.Request === 'undefined') {
  // Minimal Headers polyfill (defined first as it's used by Request/Response)
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {}
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => {
            this._headers[key.toLowerCase()] = value
          })
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value
          })
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value
          })
        }
      }
    }

    get(name) {
      return this._headers[name.toLowerCase()] || null
    }

    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }

    has(name) {
      return name.toLowerCase() in this._headers
    }

    forEach(callback) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this)
      })
    }
  }

  // Minimal Request polyfill
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this.body = init.body || null
      this.bodyUsed = false
    }

    async text() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }

    async json() {
      const text = await this.text()
      return JSON.parse(text)
    }
  }

  // Minimal Response polyfill
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
      this.bodyUsed = false
    }

    async json() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }

    async text() {
      if (this.bodyUsed) throw new Error('Body already used')
      this.bodyUsed = true
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }

    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      })
    }
  }
}

