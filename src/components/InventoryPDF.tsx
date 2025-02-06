import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { Room, Item } from '../types/inventory';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  nameCell: {
    width: '25%',
  },
  descriptionCell: {
    width: '35%',
  },
  categoryCell: {
    width: '20%',
  },
  valueCell: {
    width: '20%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    padding: 5,
  },
});

interface InventoryPDFProps {
  rooms: Room[];
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
}

const InventoryPDF = ({ rooms, t, formatCurrency }: InventoryPDFProps) => (
  <Document>
    {rooms.map((room) => (
      <Page key={room.id} size="A4" style={styles.page}>
        <Text style={styles.title}>
          {room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name)}
        </Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.nameCell]}>
              <Text>{t('inventory.itemName')}</Text>
            </View>
            <View style={[styles.tableCell, styles.descriptionCell]}>
              <Text>{t('inventory.description')}</Text>
            </View>
            <View style={[styles.tableCell, styles.categoryCell]}>
              <Text>{t('inventory.category')}</Text>
            </View>
            <View style={[styles.tableCell, styles.valueCell]}>
              <Text>{t('inventory.estimatedValue')}</Text>
            </View>
          </View>

          {/* Table Rows */}
          {room.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.nameCell]}>
                <Text>{item.name}</Text>
              </View>
              <View style={[styles.tableCell, styles.descriptionCell]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.tableCell, styles.categoryCell]}>
                <Text>{t(item.category)}</Text>
              </View>
              <View style={[styles.tableCell, styles.valueCell]}>
                <Text>{formatCurrency(item.estimatedValue)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Value */}
        <View style={styles.totalRow}>
          <Text>
            {t('inventory.totalValue')}: {formatCurrency(
              room.items.reduce((sum, item) => sum + item.estimatedValue, 0)
            )}
          </Text>
        </View>
      </Page>
    ))}
  </Document>
);

export const generatePDF = async (props: InventoryPDFProps) => {
  return await pdf(<InventoryPDF {...props} />).toBlob();
}; 