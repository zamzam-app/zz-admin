### Added By farhaan

# Testing Guide with Vitest

A simple guide to setting up and writing tests for your React + TypeScript project.

## What is Vitest?

Vitest is a testing framework for Vite projects. It helps you test your code to make sure it works correctly.

**Why Vitest?**

- Fast and simple
- Works perfectly with Vite
- Easy to learn if you know Jest

## Installation

Install the required packages:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Setup

### Step 1: Create vitest.config.ts

Create `vitest.config.ts` in your project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Step 2: Create Test Setup

Create `src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Step 3: Add Test Script

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

## Writing Tests

### Example 1: Testing a Button

**Component: `src/components/common/Button.tsx`**

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button = ({ label, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>;
};
```

**Test: `src/components/common/Button.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('shows the button text', () => {
    render(<Button label="Click Me" onClick={() => {}} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Click Me" onClick={handleClick} />);

    await userEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Example 2: Testing a Function

**Utility: `src/utils/helpers/math.ts`**

```typescript
export const add = (a: number, b: number): number => {
  return a + b;
};

export const multiply = (a: number, b: number): number => {
  return a * b;
};
```

**Test: `src/utils/helpers/math.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { add, multiply } from './math';

describe('Math Functions', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('multiplies two numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });
});
```

## Running Tests

Run your tests:

```bash
pnpm test
```

## Basic Test Structure

```typescript
describe('What you are testing', () => {
  it('does something specific', () => {
    // 1. Setup: Prepare what you need
    const result = add(2, 3);

    // 2. Check: Verify it works
    expect(result).toBe(5);
  });
});
```

## Common Test Commands

```typescript
// Check if something exists
expect(element).toBeInTheDocument();

// Check values
expect(value).toBe(5);
expect(text).toContain('hello');

// Check if function was called
expect(mockFunction).toHaveBeenCalled();
```

## File Naming

Place test files next to your components:

```
src/
├── components/
│   └── Button.tsx
│   └── Button.test.tsx
└── utils/
    └── math.ts
    └── math.test.ts
```

## Tips

- Write simple tests that check one thing
- Keep tests short and easy to read

---
