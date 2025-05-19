export function getNodeData(node: any) {
    const labels = node.labels || node.label || [];
    if (labels.includes("Founder")) {
      return {
        type: "founder",
        data: {
          name: node.name,
          image: node.image,
        },
      };
    }
    if (labels.includes("Partner")) {
      return {
        type: "partner",
        data: {
          name: node.name,
          role: node.role,
          bio: node.bio,
          image: node.image,
        },
      };
    }
  
    // fallback
    return {
      type: "person",
      data: {
        name: node.name,
        image: node.image,
      },
    };
  }