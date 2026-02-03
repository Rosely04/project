import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DollarSign, CreditCard, Check } from 'lucide-react-native';
import { Child, Payment } from '../../types';

interface ChildPaymentCardProps {
  child: Child;
  allPayments: Payment[];
  standardPayment: number;
  onPayment: (child: Child) => void;
}

export const ChildPaymentCard = ({ 
  child, 
  allPayments, 
  standardPayment, 
  onPayment 
}: ChildPaymentCardProps) => {
  
  // Filtramos los pagos específicos para este niño
  const childPayments = allPayments.filter(p => p.child_id === child.id);

  return (
    <View style={styles.childCard}>
      <View style={styles.cardContentRow}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.parentName}>Padre: {child.parent_name}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.paymentButton,
            child.has_paid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid
          ]}
          onPress={() => onPayment(child)}
        >
          {child.has_paid ? (
            <><Check size={20} color="#FFFFFF" /><Text style={styles.paymentButtonText}>OK</Text></>
          ) : (
            <><DollarSign size={20} color="#FFFFFF" /><Text style={styles.paymentButtonText}>Pagar ${standardPayment}</Text></>
          )}
        </TouchableOpacity>
      </View>
      
      {childPayments.length > 0 && (
        <View style={styles.paymentsSection}>
          <Text style={styles.paymentsTitle}>Historial de pagos:</Text>
          {childPayments.slice().reverse().slice(0, 3).map((payment) => (
            <View key={payment.id} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>${payment.amount}</Text>
                <Text style={styles.paymentDate}>{payment.payment_date}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  childCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  cardContentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  childInfo: { 
    flex: 1, 
    paddingRight: 10 
  },
  childName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 4 
  },
  parentName: { 
    fontSize: 14, 
    color: '#6B7280', 
    fontStyle: 'italic' 
  },
  paymentButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    minWidth: 120 
  },
  paymentButtonPaid: { 
    backgroundColor: '#10B981' 
  },
  paymentButtonUnpaid: { 
    backgroundColor: '#3B82F6' 
  },
  paymentButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    marginLeft: 6, 
    fontSize: 13 
  },
  paymentsSection: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB' 
  },
  paymentsTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8 
  },
  paymentItem: { 
    backgroundColor: '#F9FAFB', 
    padding: 8, 
    borderRadius: 6, 
    marginBottom: 6 
  },
  paymentInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  paymentAmount: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#10B981' 
  },
  paymentDate: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
});