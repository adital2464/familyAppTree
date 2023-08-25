import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface FamilyNode {
  id: number;
  name: string;
  parent?: FamilyNode;
  children?: FamilyNode[];
}

@Component({
  selector: 'app-family-tree',
  templateUrl: './family-tree.component.html',
  styleUrls: ['./family-tree.component.css']
})
export class FamilyTreeComponent {
  familyNodes: FamilyNode[] = [
    { id: 1, name: 'ME' }
  ];
  lastNodeId = 1;
  newParentNames: { [key: number]: string } = {}; // Initialize an object to store parent names
  newSiblingNames: { [key: number]: string } = {}; // Initialize an object to store sibling names
  newChildNames: { [key: number]: string } = {}; // Initialize an object to store child names
  errorMessages: { [key: number]: string } = {};
  exportedTreeJson: string = ''; // The Json Tree property

  constructor(private toastr: ToastrService) {}

  addParent(node: FamilyNode, parentName: string) {
    if (!parentName){
      this.toastr.error('Please insert the Parent Name');
      this.newParentNames[node.id] = ''; 
    }
    else if (!node.parent && parentName.trim() !== '') {
      const newId = ++this.lastNodeId;
      const newNode: FamilyNode = { id: newId, name: parentName, children: [node] };
      node.parent = newNode;
      this.familyNodes.push(newNode);
      this.newParentNames[node.id] = ''; // Clear the input field
      this.toastr.success('Parent added successfully.');
    }
    else {
      this.toastr.error('Node already has a parent.');
      this.newParentNames[node.id] = ''; 
    }
  }

  addSibling(node: FamilyNode, siblingName: string) {
    if (!siblingName){
      this.toastr.error('Please insert the Sibling Name');
      this.newParentNames[node.id] = ''; 
    }
    if (node.parent && siblingName.trim() !== '') {
      const newId = ++this.lastNodeId;
      const newNode: FamilyNode = { id: newId, name: siblingName, parent: node.parent };
      const siblings = node.parent.children || [];
      siblings.push(newNode);
      node.parent.children = siblings;
      this.familyNodes.push(newNode);
      this.newSiblingNames[node.id] = ''; // Clear the input field
      this.toastr.success('Sibling added successfully.');
    }
  }

  addChild(node: FamilyNode, childName: string) {
    if (!childName){
      this.toastr.error('Please insert the Child Name');
      this.newParentNames[node.id] = ''; 
    }
    else {
      const newId = ++this.lastNodeId;
      const newNode: FamilyNode = { id: newId, name: childName, parent: node };
      const children = node.children || [];
      children.push(newNode);
      node.children = children;
      this.familyNodes.push(newNode);
      this.newChildNames[node.id] = ''; // Clear the input field
      this.toastr.success('Child added successfully.');
    }
  }

  deleteNode(node: FamilyNode) {
    if(this.isMeOrParent(node)) {
      //console.log("Cannot delete the 'ME' node or its parents.");
      this.toastr.error('Cannot delete ME or his parent.');
      return;
    }
    if (node.parent) {
      const siblings = node.parent.children || [];
      node.parent.children = siblings.filter(sibling => sibling !== node);
    }
    // Recursively remove children
    this.removeSubtree(node);
    this.familyNodes = this.familyNodes.filter(familyNode => familyNode !== node);
    this.removeOrphanNodes();
    if(!node){
      node = 
        { id: 1, name: 'ME' }
      ;
    }
  }
  //Prevent deleting ME or his Parent
  private isMeOrParent(node: FamilyNode): boolean {
    if (node.name === 'ME') {
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        return this.isMeOrParent(child);
      }
    }
    return false;
  }
  
  private removeSubtree(node: FamilyNode) {
    if (node.children) {
      for (const child of node.children) {
        this.removeSubtree(child);
      }
    }
    // Remove the node itself
    const index = this.familyNodes.indexOf(node);
    if (index !== -1) {
      this.familyNodes.splice(index, 1);
    }
  }

  private removeOrphanNodes() {
    const orphanNodes = this.familyNodes.filter(node => !node.parent && !node.children?.length);
    orphanNodes.forEach(orphan => {
      const index = this.familyNodes.indexOf(orphan);
      if (index !== -1) {
        this.familyNodes.splice(index, 1);
      }
    });
  }

  exportTree() {
    const largestTree = this.findLargestTree(this.familyNodes);
    const cloneWithoutCircles = this.removeCircularReferences(largestTree);
    this.exportedTreeJson = JSON.stringify(cloneWithoutCircles, null, 2);
    console.log(this.exportedTreeJson);
  }
  //function that find the largest tree--in order to show only 1 tree
  private findLargestTree(nodes: FamilyNode[]): FamilyNode {
    let largestTree: FamilyNode = nodes[0]; // Initialize with the first node
  
    for (const node of nodes) {
      if (this.getNodeSize(node) > this.getNodeSize(largestTree)) {
        largestTree = node;
      }
    }
  
    return largestTree;
  }
  //function that find the size of the tree
  private getNodeSize(node: FamilyNode): number {
    if (!node) {
      return 0;
    }
  
    let size = 1; // Count the node itself
  
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        size += this.getNodeSize(child);
      }
    }
  
    return size;
  }
  //function that remove circular references
  private removeCircularReferences(node: FamilyNode): FamilyNode {
    const clonedNode: FamilyNode = { id: node.id, name: node.name };
    
    if (node.children && node.children.length > 0) {
      clonedNode.children = node.children.map(child => this.removeCircularReferences(child));
    }
    
    return clonedNode;
  }
  
}
