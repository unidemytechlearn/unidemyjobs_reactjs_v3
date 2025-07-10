The script is missing several closing brackets. Here's the fixed version with the added closing brackets:

At the end of the file, after the Dashboard component, we need to add:

```jsx
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

The missing brackets were needed to close:
1. The else block for the selectedApplication condition
2. The applications tab condition
3. The main container div
4. The Dashboard component function

The fixed version properly closes all opened blocks and maintains the component structure. All other parts of the code remain unchanged.