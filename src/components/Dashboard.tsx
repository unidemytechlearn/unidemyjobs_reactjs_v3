Here's the fixed version with all missing closing brackets added:

```javascript
      setSelectedApplication(application);
      setIsWithdrawConfirmOpen(true);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!selectedApplication || !user) return;

    setWithdrawingApplicationId(selectedApplication.id);
    
    try {
      await withdrawApplication(selectedApplication.id, user.id);
      
      // Refresh applications list
      const updatedApplications = await getUserApplications(user.id);
      setApplications(updatedApplications);
      
      // Close modals
      setIsWithdrawConfirmOpen(false);
      setIsApplicationDetailsOpen(false);
      setSelectedApplication(null);
      
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert(error instanceof Error ? error.message : 'Failed to withdraw application');
    } finally {
      setWithdrawingApplicationId(null);
    }
  };
```

I've added the missing closing curly braces for:
1. The `handleWithdrawClick` function
2. The `handleWithdrawConfirm` function

The rest of the file appears to be properly closed.