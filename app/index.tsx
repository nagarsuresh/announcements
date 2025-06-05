import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Announcement {
  summary?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

const ANNOUNCEMENTS_URL = 'https://raw.githubusercontent.com/nagarsuresh/announcements/refs/heads/main/assets/sample/announcements.json';



// Refresh interval in milliseconds (1 minutes)
const REFRESH_INTERVAL = 1 * 60 * 1000;

export default function Index() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(ANNOUNCEMENTS_URL, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // const data: Announcement[] = [
      //   {
      //     "summary": "Summer vacation starts June 2",
      //     "description": "Summer vacations are starting June 2",
      //     "priority": "high"
      //   },
      //   {
      //     "summary": "Board meeting June 11",
      //     "description": "There is a board meeting on June 11",
      //     "priority": "medium"
      //   },
      //   {
      //     "summary": "First day of school Aug 12",
      //     "description": "first day of school is on august 12"
      //   }
      // ];
      const data: Announcement[] = await response.json();
      console.log('Fetched data:', data);
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected an array');
      }
      
      // Filter out invalid announcements and ensure proper structure
      const validAnnouncements = data.filter(item => 
        item && (typeof item.summary === 'string' || typeof item.description === 'string')
      );
      
      console.log('Valid announcements:', validAnnouncements);
      setAnnouncements(validAnnouncements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching announcements:', err);
      
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load announcements. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchAnnouncements(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // const toggleExpansion = (index: number) => {
  //   console.log('Toggling expansion for index:', index);
  //   console.log('Current expanded items:', Array.from(expandedItems));
  //   const newExpandedItems = new Set(expandedItems);
  //   if (newExpandedItems.has(index)) {
  //     newExpandedItems.delete(index);
  //   } else {
  //     newExpandedItems.add(index);
  //     console.log('Expanded item at index:', index);
  //   }
  //   setExpandedItems(newExpandedItems);
  //   console.log('New expanded items:', Array.from(newExpandedItems));
  // };

  const toggleExpansion = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return new Set(newSet); // trigger state change
    });
  };
  

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ffebee'; // Light red
      case 'medium':
        return '#fff3e0'; // Light orange
      case 'low':
        return '#e8f5e8'; // Light green
      default:
        return '#f5f5f5'; // Light gray
    }
  };

  const getPriorityBorderColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#f44336'; // Red
      case 'medium':
        return '#ff9800'; // Orange
      case 'low':
        return '#4caf50'; // Green
      default:
        return '#ccc'; // Gray
    }
  };

  const getPriorityTextColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#d32f2f'; // Dark red
      case 'medium':
        return '#f57c00'; // Dark orange
      case 'low':
        return '#388e3c'; // Dark green
      default:
        return '#666'; // Dark gray
    }
  };

  const onRefresh = useCallback(() => {
    fetchAnnouncements(true);
  }, [fetchAnnouncements]);

  if (loading && announcements.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WHS Announcements</Text>
        <Text style={styles.headerSubtitle}>Stay updated with school news</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchAnnouncements()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196f3']}
            tintColor="#2196f3"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No announcements available</Text>
            <Text style={styles.emptySubtext}>Pull to refresh</Text>
          </View>
        ) : (
          announcements.map((announcement, index) => {
            const safeAnnouncement = {
              summary: announcement?.summary || 'No summary',
              description: announcement?.description || 'No description available',
              priority: announcement?.priority || 'low'
            };
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: getPriorityColor(safeAnnouncement.priority),
                    borderLeftColor: getPriorityBorderColor(safeAnnouncement.priority),
                  },
                ]}
                onPress={() => toggleExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.summaryText}>{safeAnnouncement.summary}</Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityBorderColor(safeAnnouncement.priority) }
                    ]}>
                      <Text style={styles.priorityText}>
                        {safeAnnouncement.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.expandIcon,
                    { color: getPriorityTextColor(safeAnnouncement.priority) }
                  ]}>
                    {expandedItems.has(index) ? '▼' : '▶'}
                  </Text>
                </View>

                {expandedItems.has(index) && (
                  <View style={styles.descriptionContainer}>
                    <View style={styles.separator} />
                    <Text style={styles.descriptionText}>
                      {safeAnnouncement.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <Text style={styles.footerSubtext}>
            Updates automatically every 1 minute
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  announcementCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#999',
  },
});
