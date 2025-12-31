# Custom Category Section Names - Guide

## ✅ Yes! You Can Customize Category Section Names

The CategorySelector now supports **custom labels** for each section. You can rename them to match your sport's terminology!

---

## 🎯 How to Use Custom Names

### Option 1: Use Default Names (Current)
- **Age Groups**
- **Strokes / Event Types**
- **Distances**

### Option 2: Customize Names in Code

You can pass custom labels when using the component:

```jsx
<CategorySelector
  value={formData.categoriesAvailable}
  onChange={(value) => setFormData(prev => ({ ...prev, categoriesAvailable: value }))}
  ageGroupLabel="Weight Classes"
  strokeLabel="Event Categories"
  distanceLabel="Rounds"
/>
```

---

## 📋 Examples for Different Sports

### Boxing/Combat Sports:
```jsx
<CategorySelector
  ageGroupLabel="Weight Classes"
  strokeLabel="Divisions"
  distanceLabel="Rounds"
/>
```
**Result:**
- Weight Classes: Featherweight, Lightweight, Heavyweight
- Divisions: Men's, Women's, Open
- Rounds: 3 rounds, 5 rounds

### Athletics:
```jsx
<CategorySelector
  ageGroupLabel="Age Divisions"
  strokeLabel="Event Types"
  distanceLabel="Distances"
/>
```

### Weightlifting:
```jsx
<CategorySelector
  ageGroupLabel="Weight Categories"
  strokeLabel="Lift Types"
  distanceLabel="Attempts"
/>
```

### Tennis:
```jsx
<CategorySelector
  ageGroupLabel="Age Groups"
  strokeLabel="Match Types"
  distanceLabel="Sets"
/>
```

---

## 🔧 Making It User-Configurable

If you want admins to set custom names themselves (without code changes), I can add input fields for custom section names. Would you like me to implement that?

---

## 💡 Current Implementation

**Right now:**
- ✅ Section names are customizable via props
- ✅ Default names work for most sports
- ✅ Parsing is flexible and handles different label names
- ✅ You can add any custom category values

**Future enhancement (if needed):**
- Add UI fields to let admins rename sections
- Store custom section names in database
- Display custom names throughout the system

---

## 🎯 Quick Examples

### Swimming (Default):
- Age Groups: Group I (11-12), Group II (13-14)
- Strokes: Freestyle, Backstroke
- Distances: 25m, 50m, 100m

### Boxing (Custom Names):
- Weight Classes: Featherweight, Lightweight
- Divisions: Men's, Women's
- Rounds: 3 rounds, 5 rounds

### Athletics (Custom Names):
- Age Divisions: U-14, U-16, Senior
- Event Types: Track, Field, Combined
- Distances: 100m, 200m, Marathon

---

The system is flexible and supports custom naming! 🎉

