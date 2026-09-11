# Development Guide

## Getting Started

This guide will help you set up the development environment and understand the project structure.

## Prerequisites

- **Node.js** 16+ and npm
- **Git** for version control
- **Code Editor**: VS Code (recommended) or your preferred editor
- **Browser**: Chrome or Firefox with developer tools

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-inventory-warehouse-management
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Project Structure Explained

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Sidebar.jsx   # Navigation sidebar
│   │   ├── Topbar.jsx    # Top navigation bar
│   │   ├── StatCard.jsx  # Metric display card
│   │   └── ...           # Other components
│   │
│   ├── pages/            # Page-level components
│   │   ├── Dashboard.jsx # Main dashboard
│   │   ├── Products.jsx  # Product listing
│   │   └── ...           # Other pages
│   │
│   ├── layouts/          # Layout wrappers
│   │   └── MainLayout.jsx
│   │
│   ├── data/             # Demo data (temporary)
│   │   ├── products.js
│   │   ├── inventory.js
│   │   └── ...
│   │
│   ├── services/         # API service layer
│   │   └── api.js        # API functions
│   │
│   ├── App.jsx           # Main app with routes
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
│
├── public/               # Static assets
└── package.json          # Dependencies
```

## Code Organization Principles

### Components

**Reusable components** are in `src/components/`:
- Keep components small and focused
- Each component should do one thing well
- Use props for customization

Example:
```jsx
// StatCard.jsx
export default function StatCard({ title, value, icon, trend }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
```

### Pages

**Page components** are in `src/pages/`:
- Compose multiple components
- Handle page-level state
- Connect to data services

Example:
```jsx
// Dashboard.jsx
import StatCard from '../components/StatCard';
import { getProducts } from '../services/api';

export default function Dashboard() {
  const products = getProducts();
  
  return (
    <div>
      <StatCard title="Total Products" value={products.length} />
    </div>
  );
}
```

### Data

**Demo data files** are in `src/data/`:
- Currently contains static data
- Will be replaced by API calls later
- Keep data realistic and consistent

Example:
```javascript
// products.js
export const products = [
  {
    id: 'M101',
    name: 'Wireless Mouse',
    sku: 'M101',
    // ...
  }
];
```

### Services

**API service layer** in `src/services/api.js`:
- All data fetching functions
- Currently returns demo data
- Will be replaced with real API calls

Example:
```javascript
// api.js
import { products } from '../data/products';

export function getProducts() {
  // TODO: Replace with actual API call
  return products;
}

export function getProductById(id) {
  return products.find(p => p.id === id);
}
```

## Styling Guidelines

### CSS Approach

- Use vanilla CSS for simplicity
- Keep styles scoped where possible
- Use consistent naming conventions
- Make everything responsive

### CSS Variables

Use CSS variables for consistency:
```css
:root {
  --primary-color: #4f46e5;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --bg-light: #f9fafb;
  --text-dark: #1f2937;
}
```

### Responsive Design

Test on multiple screen sizes:
- Desktop: 1920px, 1440px, 1024px
- Tablet: 768px
- Mobile: 375px, 414px

Use media queries:
```css
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
```

## Adding a New Page

1. **Create page component**
   ```bash
   frontend/src/pages/MyNewPage.jsx
   ```

2. **Add route in App.jsx**
   ```jsx
   import MyNewPage from './pages/MyNewPage';
   
   <Route path="/my-new-page" element={<MyNewPage />} />
   ```

3. **Add navigation link**
   ```jsx
   // In Sidebar.jsx
   <NavLink to="/my-new-page">My New Page</NavLink>
   ```

4. **Create any needed components**
   ```bash
   frontend/src/components/MyComponent.jsx
   ```

## Adding Demo Data

1. **Create data file**
   ```javascript
   // src/data/mydata.js
   export const myData = [
     { id: 1, name: 'Item 1' },
     { id: 2, name: 'Item 2' }
   ];
   ```

2. **Add service function**
   ```javascript
   // src/services/api.js
   import { myData } from '../data/mydata';
   
   export function getMyData() {
     return myData;
   }
   ```

3. **Use in component**
   ```jsx
   import { getMyData } from '../services/api';
   
   const data = getMyData();
   ```

## Git Workflow

### Daily Workflow

1. **Start your day**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Edit files
   - Test changes
   - Commit frequently

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Add feature description"
   ```

5. **Push branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to repository
   - Create PR from your branch to main
   - Request review

### Commit Message Format

Follow this format:
```
Add product filtering feature

- Add filter dropdown component
- Implement category filter
- Add search functionality
- Update product page layout
```

Good examples:
- ✅ "Add warehouse detail page"
- ✅ "Fix inventory calculation bug"
- ✅ "Update dashboard chart colors"

Bad examples:
- ❌ "updates"
- ❌ "fix bug"
- ❌ "asdfasdf"

### Branch Naming

- `feature/dashboard-charts`
- `feature/product-filtering`
- `bugfix/inventory-count`
- `enhancement/mobile-responsive`

## Code Quality Checklist

Before committing, check:

- [ ] Code follows existing style
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Variable names are descriptive
- [ ] Components are reusable
- [ ] No hardcoded values (use constants)
- [ ] Responsive on mobile
- [ ] No browser console errors
- [ ] Code is formatted consistently

## Common Tasks

### Adding a Reusable Component

```jsx
// components/Button.jsx
export default function Button({ 
  children, 
  onClick, 
  variant = 'primary' 
}) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Using the Component

```jsx
import Button from '../components/Button';

<Button variant="primary" onClick={handleClick}>
  Save Product
</Button>
```

### Adding a Table

```jsx
<table className="data-table">
  <thead>
    <tr>
      <th>Product</th>
      <th>Stock</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {products.map(product => (
      <tr key={product.id}>
        <td>{product.name}</td>
        <td>{product.stock}</td>
        <td>
          <span className={`badge badge-${product.status}`}>
            {product.status}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Debugging Tips

### React Developer Tools
- Install React DevTools browser extension
- Inspect component props and state
- Track re-renders

### Console Debugging
```jsx
console.log('Products:', products);
console.table(products); // Better for arrays
```

### Network Debugging
- Open browser DevTools
- Check Network tab
- Monitor API calls (when implemented)

## Testing the Application

### Manual Testing Checklist

- [ ] All pages load without errors
- [ ] Navigation works
- [ ] Tables display data correctly
- [ ] Charts render properly
- [ ] Filters work as expected
- [ ] Search functionality works
- [ ] Responsive on mobile
- [ ] No console errors

### Browser Testing

Test on:
- Chrome
- Firefox
- Safari (if on Mac)
- Edge

### Responsive Testing

Test breakpoints:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px, 1440px

## Common Issues

### Issue: Port Already in Use

```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill
```

### Issue: Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Changes Not Reflecting

- Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
- Clear browser cache
- Restart dev server

## Preparing for Backend Integration

When backend is ready:

1. **Update API service**
   ```javascript
   // Change from:
   export function getProducts() {
     return products;
   }
   
   // To:
   export async function getProducts() {
     const response = await fetch('/api/products');
     return response.json();
   }
   ```

2. **Update components to handle async**
   ```jsx
   const [products, setProducts] = useState([]);
   
   useEffect(() => {
     getProducts().then(setProducts);
   }, []);
   ```

3. **Add loading states**
   ```jsx
   const [loading, setLoading] = useState(true);
   
   useEffect(() => {
     getProducts()
       .then(setProducts)
       .finally(() => setLoading(false));
   }, []);
   
   if (loading) return <div>Loading...</div>;
   ```

## Next Steps

Once frontend is stable:

1. **Backend Development**
   - Set up Express API
   - Create database schema
   - Implement authentication

2. **ML Service**
   - Develop prediction models
   - Create FastAPI endpoints
   - Integrate with backend

3. **Mobile Application**
   - Set up React Native
   - Implement scanner
   - Connect to backend API

4. **AI Integration**
   - Connect Gemini API
   - Implement chat interface
   - Add context processing

## Questions?

- Check existing code for examples
- Read component comments
- Ask team members
- Create issues for bugs

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [MDN Web Docs](https://developer.mozilla.org)

---

Happy coding! 🚀
