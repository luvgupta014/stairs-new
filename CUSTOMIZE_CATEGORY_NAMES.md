# How to Customize Category Section Names

## ✅ Yes! You Can Use Custom Category Names

The CategorySelector component now supports **custom section labels**. You can rename the three sections to match your sport's terminology!

---

## 🎯 Current Default Names

- **Age Groups** (first section)
- **Strokes / Event Types** (second section)  
- **Distances** (third section)

---

## 🔧 How to Customize (Code Level)

### Example 1: Boxing/Combat Sports

```jsx
<CategorySelector
  value={formData.categoriesAvailable}
  onChange={(value) => setFormData(prev => ({ ...prev, categoriesAvailable: value }))}
  ageGroupLabel="Weight Classes"
  strokeLabel="Divisions"
  distanceLabel="Rounds"
/>
```

**Result:**
- Weight Classes: Featherweight, Lightweight, Heavyweight
- Divisions: Men's, Women's, Open
- Rounds: 3 rounds, 5 rounds

### Example 2: Tennis

```jsx
<CategorySelector
  ageGroupLabel="Age Groups"
  strokeLabel="Match Types"
  distanceLabel="Sets"
/>
```

### Example 3: Weightlifting

```jsx
<CategorySelector
  ageGroupLabel="Weight Categories"
  strokeLabel="Lift Types"
  distanceLabel="Attempts"
/>
```

---

## 💡 Want Admin-Configurable Names?

If you want admins to set custom section names **without code changes**, I can add:

1. **Input fields** in the form to set custom section names
2. **Store custom names** in the event data
3. **Display custom names** throughout the system

Would you like me to implement this? It would allow admins to:
- Set "Weight Classes" instead of "Age Groups" for boxing events
- Set "Divisions" instead of "Strokes" for combat sports
- Set "Rounds" instead of "Distances" for certain sports

---

## 📋 Current Flexibility

**Right Now:**
- ✅ You can add **any custom category values** (already works!)
- ✅ Section labels can be customized via props (code level)
- ✅ Parsing is flexible and handles different label names

**What You're Asking For:**
- Custom section **names** (not just values)
- This can be done via props (code level) or UI (admin-configurable)

---

## 🚀 Quick Answer

**Yes, you can customize category section names!**

**Option 1 (Code):** Pass custom labels as props (shown above)

**Option 2 (UI - if you want):** I can add input fields so admins can set custom names themselves

Which approach would you prefer?

