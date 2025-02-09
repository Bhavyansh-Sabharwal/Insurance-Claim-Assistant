import { Document, Page, View, Text, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer';
import { Room, Item } from '../types/inventory';


const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
  },
  documentTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  dateContainer: {
    marginBottom: 20,
  },
  roomSection: {
    marginBottom: 30,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#34495e',
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#34495e',
    color: '#ffffff',
    fontWeight: 'bold',
    minHeight: 35,
  },
  tableCell: {
    padding: '8 5',
  },
  imageCell: {
    width: '15%',
  },
  nameCell: {
    width: '20%',
  },
  descriptionCell: {
    width: '25%',
  },
  categoryCell: {
    width: '15%',
  },
  valueCell: {
    width: '10%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 25,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#bdc3c7',
    paddingTop: 8,
    marginTop: 10,
  },
  whiteText: {
    color: '#ffffff',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    fontSize: 9,
    color: '#7f8c8d',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
  },
  itemImage: {
    width: '100%',
    height: 50,
    objectFit: 'cover', // Ensure the image fits within the cell
  },
});

interface InventoryPDFProps {
  rooms: Room[];
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  address?: string;
}

const InventoryPDF = ({ rooms, t, formatCurrency, address }: InventoryPDFProps) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const documentNumber = `INV-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <Document>
      {rooms.map((room) => (
        <Page key={room.id} size="A4" style={styles.page}>
          {/* Enhanced Header Section */}
          <View style={styles.headerInfo}>
            <View style={styles.headerLeft}>
              <Text>{t('inventory.organization') || 'Home Inventory'}</Text>
              <Text>{t('inventory.documentNumber')}{documentNumber}</Text>
              {address && <Text>{address}</Text>}
            </View>
            <View style={styles.headerRight}>
              <Text>{t('inventory.date')}{formattedDate}</Text>
            </View>
          </View>

          {/* Room Section */}
          <View style={styles.roomSection}>
            <Text style={styles.roomTitle}>
              {room.name.startsWith('custom.') ? room.name.slice(7) : t(room.name)}
            </Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, styles.imageCell]}>
                  <Text style={styles.whiteText}>{t('inventory.image')}</Text>
                </View>
                <View style={[styles.tableCell, styles.nameCell]}>
                  <Text style={styles.whiteText}>{t('inventory.itemName')}</Text>
                </View>
                <View style={[styles.tableCell, styles.descriptionCell]}>
                  <Text style={styles.whiteText}>{t('inventory.description')}</Text>
                </View>
                <View style={[styles.tableCell, styles.categoryCell]}>
                  <Text style={styles.whiteText}>{t('inventory.category')}</Text>
                </View>
                <View style={[styles.tableCell, styles.valueCell]}>
                  <Text style={styles.whiteText}>{t('inventory.estimatedValue')}</Text>
                </View>
              </View>

              {/* Table Rows */}
              {room.items.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.imageCell]}>
                    {item.imageUrl && <Image style={styles.itemImage} src={item.imageUrl} />}
                  </View>
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
              <Text style={styles.totalText}>
                {t('inventory.totalValue')}: {formatCurrency(
                  room.items.reduce((sum, item) => sum + item.estimatedValue, 0)
                )}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>{t('inventory.footerText') || 'Inventory Report - Generated automatically'}</Text>
            <Text>Page {rooms.indexOf(room) + 1} of {rooms.length}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export const generatePDF = async (props: InventoryPDFProps) => {
  return await pdf(<InventoryPDF {...props} />).toBlob();
};
