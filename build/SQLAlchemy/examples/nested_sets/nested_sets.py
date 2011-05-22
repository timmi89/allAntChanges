"""Celko's "Nested Sets" Tree Structure.

http://www.intelligententerprise.com/001020/celko.jhtml

"""

from sqlalchemy import (create_engine, Column, Integer, String, select, case,
    func)
from sqlalchemy.orm import sessionmaker, MapperExtension, aliased
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine('sqlite://', echo=True)
Base = declarative_base()

class NestedSetExtension(MapperExtension):
    def before_insert(self, mapper, connection, instance):
        if not instance.parent:
            instance.left = 1
            instance.right = 2
        else:
            personnel = mapper.mapped_table
            right_most_sibling = connection.scalar(
                select([personnel.c.rgt]).where(personnel.c.emp==instance.parent.emp)
            )

            connection.execute(
                personnel.update(personnel.c.rgt>=right_most_sibling).values(
                    lft = case(
                            [(personnel.c.lft>right_most_sibling, personnel.c.lft + 2)],
                            else_ = personnel.c.lft
                          ),
                    rgt = case(
                            [(personnel.c.rgt>=right_most_sibling, personnel.c.rgt + 2)],
                            else_ = personnel.c.rgt
                          )
                )
            )
            instance.left = right_most_sibling
            instance.right = right_most_sibling + 1

    # before_update() would be needed to support moving of nodes
    # after_delete() would be needed to support removal of nodes.
    # [ticket:1172] needs to be implemented for deletion to work as well.

class Employee(Base):
    __tablename__ = 'personnel'
    __mapper_args__ = {
        'extension':NestedSetExtension(), 
        'batch':False  # allows extension to fire for each instance before going to the next.
    }

    parent = None

    emp = Column(String, primary_key=True)

    left = Column("lft", Integer, nullable=False)
    right = Column("rgt", Integer, nullable=False)

    def __repr__(self):
        return "Employee(%s, %d, %d)" % (self.emp, self.left, self.right)

Base.metadata.create_all(engine)

session = sessionmaker(bind=engine)()

albert = Employee(emp='Albert')
bert = Employee(emp='Bert')
chuck = Employee(emp='Chuck')
donna = Employee(emp='Donna')
eddie = Employee(emp='Eddie')
fred = Employee(emp='Fred')

bert.parent = albert
chuck.parent = albert
donna.parent = chuck
eddie.parent = chuck
fred.parent = chuck

# the order of "add" is important here.  elements must be added in
# the order in which they should be INSERTed.
session.add_all([albert, bert, chuck, donna, eddie, fred])
session.commit()

print session.query(Employee).all()

# 1. Find an employee and all his/her supervisors, no matter how deep the tree.
ealias = aliased(Employee)
print session.query(Employee).\
            filter(ealias.left.between(Employee.left, Employee.right)).\
            filter(ealias.emp=='Eddie').all()

#2. Find the employee and all his/her subordinates. (This query has a nice symmetry with the first query.)
print session.query(Employee).\
    filter(Employee.left.between(ealias.left, ealias.right)).\
    filter(ealias.emp=='Chuck').all()

#3. Find the level of each node, so you can print the tree as an indented listing.
for indentation, employee in session.query(func.count(Employee.emp).label('indentation') - 1, ealias).\
    filter(ealias.left.between(Employee.left, Employee.right)).\
    group_by(ealias.emp).\
    order_by(ealias.left):
    print "    " * indentation + str(employee)

